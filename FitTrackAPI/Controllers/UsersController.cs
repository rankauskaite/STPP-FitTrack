using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using FitTrackAPI.Services;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FitTrackAPI.Controllers
{
    public class ClientTrainingPlanDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Type { get; set; } = null!;
        public int DurationWeeks { get; set; }
        public bool IsPublic { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ClientWithPlansDto
    {
        public string Username { get; set; } = null!;
        public string? FullName { get; set; }
        public string Role { get; set; } = null!;
        public List<ClientTrainingPlanDto> TrainingPlans { get; set; } = new();
    }

    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        private readonly PasswordService _passwordService;
        private readonly JwtTokenService _tokenService;

        public UsersController(FitTrackDbContext context, PasswordService passwordService, JwtTokenService tokenService)
        {
            _context = context;
            _passwordService = passwordService;
            _tokenService = tokenService;
        }

        private string? GetCurrentUsername()
        {
            return User.FindFirst("username")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("unique_name")?.Value
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
            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { message = "Vardas negali būti tuščias." });

            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest(new { message = "Slapyvardis negali būti tuščias" });

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Slaptažodis negali būti tuščias." });

            if (request.Password.Length < 4)
                return BadRequest(new { message = "Slaptažodį turi sudaryti bent 4 simboliai." });

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return BadRequest(new { message = "Jau egzistuoja toks naudotojas." });

            var user = new User
            {
                Username = request.Username,
                FullName = request.FullName,
                Role = Role.Member
            };

            user.Password = _passwordService.HashPassword(user, request.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var accessToken = _tokenService.GenerateAccessToken(user);
            var (refreshToken, refreshExpiry) = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = refreshExpiry;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Registracija sėkminga.",
                accessToken,
                refreshToken,
                role = user.Role.ToString(),
                username = user.Username
            });
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

            var currentUser = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == currentUsername);

            if (currentUser == null) return Unauthorized();

            var targetUser = await _context.Users.FindAsync(username);
            if (targetUser == null) return NotFound("Vartotojas nerastas.");

            if (IsAdmin()) return Ok(targetUser);

            if (currentUser.Role == Role.Member)
            {
                if (targetUser.Username == currentUser.Username || targetUser.Role == Role.Trainer)
                    return Ok(targetUser);
                return Forbid();
            }

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

            if (IsAdmin())
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

        // -------------------- TRAINER / ADMIN: GAUTI KLIENTUS + JŲ PLANUS --------------------
        [Authorize(Roles = "Trainer,Admin")]
        [HttpGet("my-clients")]
        public async Task<ActionResult<IEnumerable<ClientWithPlansDto>>> GetMyClients()
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            if (IsAdmin())
            {
                var allUsers = await _context.Users
                    .Include(u => u.TrainingPlans)
                    .ToListAsync();

                var allDtos = allUsers.Select(u => new ClientWithPlansDto
                {
                    Username = u.Username,
                    FullName = u.FullName,
                    Role = u.Role.ToString(),
                    TrainingPlans = u.TrainingPlans.Select(tp => new ClientTrainingPlanDto
                    {
                        Id = tp.Id,
                        Name = tp.Name,
                        Type = tp.Type,
                        DurationWeeks = tp.DurationWeeks,
                        IsPublic = tp.IsPublic,
                        ImageUrl = tp.ImageUrl
                    }).ToList()
                }).ToList();

                return Ok(allDtos);
            }

            var trainer = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == currentUsername);

            if (trainer == null) return Unauthorized();

            var clientUsernames = trainer.Clients.Select(c => c.Username).ToList();

            var clients = await _context.Users
                .Where(u => clientUsernames.Contains(u.Username))
                .Include(u => u.TrainingPlans)
                .ToListAsync();

            var dtos = clients.Select(u => new ClientWithPlansDto
            {
                Username = u.Username,
                FullName = u.FullName,
                Role = u.Role.ToString(),
                TrainingPlans = u.TrainingPlans.Select(tp => new ClientTrainingPlanDto
                {
                    Id = tp.Id,
                    Name = tp.Name,
                    Type = tp.Type,
                    DurationWeeks = tp.DurationWeeks,
                    IsPublic = tp.IsPublic,
                    ImageUrl = tp.ImageUrl
                }).ToList()
            }).ToList();

            return Ok(dtos);
        }

        // -------------------- TRAINER: PAŠALINTI KLIENTĄ --------------------
        [Authorize(Roles = "Trainer,Admin")]
        [HttpDelete("{trainerUsername}/remove-client/{clientUsername}")]
        public async Task<IActionResult> RemoveClient(string trainerUsername, string clientUsername)
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            if (!IsAdmin() && currentUsername != trainerUsername)
                return Forbid();

            var trainer = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == trainerUsername);

            if (trainer == null)
                return NotFound("Treneris nerastas.");

            var client = trainer.Clients.FirstOrDefault(c => c.Username == clientUsername);
            if (client == null)
                return NotFound("Toks klientas nepriskirtas šiam treneriui.");

            trainer.Clients.Remove(client);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // -------------------- TRAINER: PAIEŠKA KLIENTŲ PAGAL SLAPYVARDĮ --------------------
        [Authorize(Roles = "Trainer,Admin")]
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchClients([FromQuery] string query)
        {
            var currentUsername = GetCurrentUsername();
            if (currentUsername == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
                return Ok(new List<object>());

            query = query.Trim().ToLower();

            var usersQuery = _context.Users
                .Where(u => u.Role == Role.Member &&
                            (u.Username.ToLower().Contains(query) ||
                             (u.FullName != null && u.FullName.ToLower().Contains(query))))
                .OrderBy(u => u.Username)
                .Take(10);

            var result = await usersQuery
                .Select(u => new
                {
                    username = u.Username,
                    fullName = u.FullName,
                    role = u.Role.ToString()
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}