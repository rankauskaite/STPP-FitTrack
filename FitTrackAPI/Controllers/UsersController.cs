using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using FitTrackAPI.Services;
using System.Security.Claims;

namespace FitTrackAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        private readonly PasswordService _passwordService;

        public UsersController(FitTrackDbContext context, PasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        private string? GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
        }

        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;
        private bool IsAdmin() => GetCurrentUserRole() == "Admin";
        private bool IsTrainer() => GetCurrentUserRole() == "Trainer";

        // -------------------- REGISTRACIJA --------------------
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return BadRequest("Toks vartotojas jau egzistuoja.");

            var user = new User
            {
                Username = request.Username,
                FullName = request.FullName,
                Role = Role.Member
            };

            user.Password = _passwordService.HashPassword(user, request.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registracija sėkminga", username = user.Username });
        }

        public class RegisterRequest
        {
            public string Username { get; set; } = null!;
            public string Password { get; set; } = null!;
            public string FullName { get; set; } = null!;
        }

        // -------------------- ADMIN: GAUTI VISUS VARTOTOJUS --------------------
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.Clients)
                .Include(u => u.SavedPlans)
                .Include(u => u.TrainingPlans)
                .ToListAsync();

            return Ok(users);
        }

        // -------------------- GET: api/users/me --------------------
        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<User>> GetMyProfile()
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null) return NotFound("Vartotojas nerastas.");

            return Ok(user);
        }

        // -------------------- GET: api/users/{username} --------------------
        [Authorize]
        [HttpGet("{username}")]
        public async Task<ActionResult<User>> GetByUsername(string username)
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            var currentUser = await _context.Users.Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == currentUsername);
            if (currentUser == null) return Unauthorized();

            var targetUser = await _context.Users.FindAsync(username);
            if (targetUser == null) return NotFound("Vartotojas nerastas.");

            // Admin gali matyti viską
            if (IsAdmin()) return Ok(targetUser);

            // Vartotojas – gali matyti tik save ir trenerius
            if (currentUser.Role == Role.Member)
            {
                if (targetUser.Username == currentUser.Username || targetUser.Role == Role.Trainer)
                    return Ok(targetUser);
                return Forbid();
            }

            // Treneris – gali matyti save, savo klientus ir kitus trenerius
            if (IsTrainer())
            {
                if (targetUser.Username == currentUser.Username ||
                    currentUser.Clients.Any(c => c.Username == targetUser.Username) ||
                    targetUser.Role == Role.Trainer)
                    return Ok(targetUser);
                return Forbid();
            }

            return Forbid();
        }

        // -------------------- PUT: api/users/{username} --------------------
        [Authorize]
        [HttpPut("{username}")]
        public async Task<IActionResult> Update(string username, [FromBody] User updatedUser)
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            var targetUser = await _context.Users.FindAsync(username);
            if (targetUser == null) return NotFound("Vartotojas nerastas.");

            if (!IsAdmin() && currentUsername != targetUser.Username)
                return Forbid();

            targetUser.FullName = updatedUser.FullName;

            if (!string.IsNullOrWhiteSpace(updatedUser.Password))
                targetUser.Password = _passwordService.HashPassword(targetUser, updatedUser.Password);

            if (IsAdmin()) // tik admin gali keisti roles
                targetUser.Role = updatedUser.Role;

            await _context.SaveChangesAsync();
            return Ok(targetUser);
        }

        // -------------------- DELETE: api/users/{username} --------------------
        [Authorize]
        [HttpDelete("{username}")]
        public async Task<IActionResult> Delete(string username)
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null) return NotFound("Vartotojas nerastas.");

            if (!IsAdmin() && user.Username != currentUsername)
                return Forbid();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // -------------------- GET: api/users/trainers --------------------
        [Authorize]
        [HttpGet("trainers")]
        public async Task<ActionResult<IEnumerable<User>>> GetTrainers()
        {
            var trainers = await _context.Users
                .Where(u => u.Role == Role.Trainer)
                .ToListAsync();
            return Ok(trainers);
        }

        // -------------------- TRAINER: PRIDĖTI KLIENTĄ --------------------
        [Authorize(Roles = "Trainer,Admin")]
        [HttpPost("{trainerUsername}/add-client/{clientUsername}")]
        public async Task<IActionResult> AddClient(string trainerUsername, string clientUsername)
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            // Tik pats treneris arba admin gali pridėti klientą
            if (!IsAdmin() && currentUsername != trainerUsername)
                return Forbid();

            var trainer = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == trainerUsername);

            var client = await _context.Users.FindAsync(clientUsername);
            if (trainer == null || client == null)
                return NotFound("Treneris arba klientas nerastas.");

            if (!trainer.Clients.Any(c => c.Username == client.Username))
                trainer.Clients.Add(client);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Klientas pridėtas sėkmingai." });
        }
    }
}