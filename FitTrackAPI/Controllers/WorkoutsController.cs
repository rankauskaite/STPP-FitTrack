using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;
using FitTrackAPI.Services;

namespace FitTrackAPI.Controllers
{
    public class CreateWorkoutRequest
    {
        public string Name { get; set; } = null!;
        public DateTime Date { get; set; }
        public WorkoutType Type { get; set; }
        public int DurationMinutes { get; set; }
        public int CaloriesBurned { get; set; }
    }

    public class UpdateWorkoutRequest
    {
        public string Name { get; set; } = null!;
        public DateTime Date { get; set; }
        public WorkoutType Type { get; set; }
        public int DurationMinutes { get; set; }
        public int CaloriesBurned { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutsController : ControllerBase
    {
        private readonly FitTrackDbContext _context;

        public WorkoutsController(FitTrackDbContext context)
        {
            _context = context;
        }

        // -------------------- Pagalbiniai metodai --------------------
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

        private async Task<User?> GetCurrentUserWithClients()
        {
            var username = GetCurrentUsername();
            if (username == null) return null;

            return await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        // DateTime → UTC
        private static DateTime AsUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
            };
        }

        // -------------------- GET: api/workouts --------------------
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Workout>>> GetAll()
        {
            var query = _context.Workouts
                                .Include(w => w.User)
                                .Include(w => w.TrainingPlans)
                                .Include(w => w.Exercises)
                                .AsQueryable();

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                // Svečias – tik trenerių treniruotes
                return await query
                    .Where(w => w.User != null && w.User.Role == Role.Trainer)
                    .ToListAsync();
            }

            if (IsAdmin())
                return await query.ToListAsync();

            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                var clientUsernames = currentUser?.Clients.Select(c => c.Username).ToList()
                                      ?? new List<string>();

                return await query
                    .Where(w =>
                        // savo treniruotės
                        w.Username == username
                        // trenerių treniruotės
                        || (w.User != null && w.User.Role == Role.Trainer)
                        // savo klientų treniruotės
                        || clientUsernames.Contains(w.Username))
                    .ToListAsync();
            }

            // Member – savo ir trenerių treniruotes
            return await query
                .Where(w => w.Username == username
                            || (w.User != null && w.User.Role == Role.Trainer))
                .ToListAsync();
        }

        // -------------------- GET: api/workouts/{id} --------------------
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<Workout>> Get(int id)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.User)
                                        .Include(w => w.Exercises)
                                        .Include(w => w.TrainingPlans)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                // svečias – tik trenerio treniruotė
                if (workout.User?.Role != Role.Trainer)
                    return Forbid();
                return Ok(workout);
            }

            if (IsAdmin())
                return Ok(workout);

            // savo treniruotė
            if (workout.Username == username)
                return Ok(workout);

            // trenerio treniruotė
            if (workout.User?.Role == Role.Trainer)
                return Ok(workout);

            // jei esu treneris – leidžiam kliento treniruotę
            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                if (currentUser != null &&
                    currentUser.Clients.Any(c => c.Username == workout.Username))
                {
                    return Ok(workout);
                }
            }

            return Forbid();
        }

        // -------------------- POST: api/workouts --------------------
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Workout>> Create(
            [FromBody] CreateWorkoutRequest request,
            [FromQuery] List<int>? planIds)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var workout = new Workout
            {
                Username = username,
                Name = request.Name,
                Date = AsUtc(request.Date),
                Type = request.Type,
                DurationMinutes = request.DurationMinutes,
                CaloriesBurned = request.CaloriesBurned,
                ImageUrl = WorkoutImageService.GetImageForType(request.Type),
                TrainingPlans = new List<TrainingPlan>()
            };

            if (planIds != null)
            {
                foreach (var pid in planIds)
                {
                    var plan = await _context.TrainingPlans.FindAsync(pid);
                    if (plan != null)
                        workout.TrainingPlans.Add(plan);
                }
            }

            _context.Workouts.Add(workout);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = workout.Id }, workout);
        }

        // -------------------- PUT: api/workouts/{id} --------------------
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateWorkoutRequest request,
            [FromQuery] List<int>? planIds)
        {
            var existing = await _context.Workouts
                                        .Include(w => w.TrainingPlans)
                                        .Include(w => w.Exercises)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (existing == null)
                return NotFound("Treniruotė nerasta.");

            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            if (existing.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && existing.Username != username)
                return Forbid();

            existing.Name = request.Name;
            existing.Type = request.Type;
            existing.Date = AsUtc(request.Date);
            existing.DurationMinutes = request.DurationMinutes;
            existing.CaloriesBurned = request.CaloriesBurned;
            existing.ImageUrl = WorkoutImageService.GetImageForType(request.Type);

            if (planIds != null)
            {
                var currentPlanIds = existing.TrainingPlans.Select(p => p.Id).ToList();

                foreach (var pid in planIds.Except(currentPlanIds))
                {
                    var plan = await _context.TrainingPlans.FindAsync(pid);
                    if (plan != null)
                        existing.TrainingPlans.Add(plan);
                }

                foreach (var pid in currentPlanIds.Except(planIds))
                {
                    var plan = existing.TrainingPlans.FirstOrDefault(p => p.Id == pid);
                    if (plan != null)
                        existing.TrainingPlans.Remove(plan);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // -------------------- DELETE: api/workouts/{id} --------------------
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var workout = await _context.Workouts.FindAsync(id);
            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            if (workout.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && workout.Username != username)
                return Forbid();

            _context.Workouts.Remove(workout);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // -------------------- GET: api/workouts/{id}/exercises --------------------
        [AllowAnonymous]
        [HttpGet("{id}/exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises(int id)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .Include(w => w.User)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                if (workout.User?.Role != Role.Trainer)
                    return Forbid();
                return Ok(workout.Exercises);
            }

            if (IsAdmin())
                return Ok(workout.Exercises);

            // savo treniruotės pratimai
            if (workout.Username == username)
                return Ok(workout.Exercises);

            // trenerio treniruotės pratimai
            if (workout.User?.Role == Role.Trainer)
                return Ok(workout.Exercises);

            // treneris – savo kliento treniruotės pratimai
            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                if (currentUser != null &&
                    currentUser.Clients.Any(c => c.Username == workout.Username))
                {
                    return Ok(workout.Exercises);
                }
            }

            return Forbid();
        }

        // -------------------- POST: api/workouts/{id}/add-exercises --------------------
        [Authorize]
        [HttpPost("{id}/add-exercises")]
        public async Task<IActionResult> AddExercises(int id, [FromQuery] List<int> exerciseIds)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            if (workout.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && workout.Username != username)
                return Forbid();

            foreach (var exId in exerciseIds)
            {
                var exercise = await _context.Exercises.FindAsync(exId);
                if (exercise != null && !workout.Exercises.Contains(exercise))
                {
                    workout.Exercises.Add(exercise);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(workout.Exercises);
        }

        // -------------------- DELETE: api/workouts/{id}/exercises --------------------
        [Authorize]
        [HttpDelete("{id}/exercises")]
        public async Task<IActionResult> RemoveExercises(int id, [FromQuery] List<int> exerciseIds)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            if (workout.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && workout.Username != username)
                return Forbid();

            bool removedAny = false;

            foreach (var eid in exerciseIds)
            {
                var exercise = workout.Exercises.FirstOrDefault(e => e.Id == eid);
                if (exercise != null)
                {
                    workout.Exercises.Remove(exercise);
                    removedAny = true;
                }
            }

            if (!removedAny)
                return NotFound("Nerasta jokių pratimų treniruotėje.");

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}