using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;

namespace FitTrackAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        public UsersController(FitTrackDbContext context) => _context = context;

        // Registracija
        [HttpPost("register")]
        public async Task<IActionResult> Register(User user)
        {
            if (await _context.Users.AnyAsync(u => u.Username == user.Username))
                return BadRequest("Toks vartotojas jau egzistuoja.");

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = user.Username }, user);
        }

        // Prisijungimas
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.Password == request.Password);

            if (user == null) return Unauthorized();
            return Ok(user);
        }

        public class LoginRequest
        {
            public string Username { get; set; } = null!;
            public string Password { get; set; } = null!;
        }

        // Atsijungimas (paprastai – tik pranešimas)
        [HttpPost("logout")]
        public IActionResult Logout() => Ok("Atsijungta.");

        // Gauti visus vartotojus (admin)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAll() =>
            await _context.Users.ToListAsync();

        // Gauti vartotoją pagal id
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetById(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        // Atnaujinti vartotoją pagal id
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, User updatedUser)
        {
            if (id != updatedUser.Id)
                return BadRequest("ID neatitinka vartotojo.");

            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null) return NotFound();

            // Atnaujiname tik pagrindinius laukus
            existingUser.FullName = updatedUser.FullName;
            existingUser.Username = updatedUser.Username;
            existingUser.Password = updatedUser.Password;
            existingUser.Role = updatedUser.Role;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Šalinti vartotoją (admin)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Trenerio klientų valdymas
        [HttpPost("{trainerId}/add-client/{clientId}")]
        public async Task<IActionResult> AddClient(int trainerId, int clientId)
        {
            var trainer = await _context.Users.Include(u => u.Clients).FirstOrDefaultAsync(u => u.Id == trainerId);
            var client = await _context.Users.FindAsync(clientId);

            if (trainer == null || client == null) return NotFound();
            if (!trainer.Clients.Contains(client))
                trainer.Clients.Add(client);

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
