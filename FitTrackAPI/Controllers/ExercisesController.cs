using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;

namespace FitTrackAPI.Controllers
{
    public class CreateExerciseRequest
    {
        public int? ExerciseTemplateId { get; set; }   // jei pasirinko default
        public string? Name { get; set; }              // jei kuria savo
        public int Sets { get; set; }
        public int Reps { get; set; }
        public double Weight { get; set; }
    }

    public class UpdateExerciseRequest
    {
        public string Name { get; set; } = null!;
        public int Sets { get; set; }
        public int Reps { get; set; }
        public double Weight { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ExercisesController : ControllerBase
    {
        private readonly FitTrackDbContext _context;

        public ExercisesController(FitTrackDbContext context)
        {
            _context = context;
        }

        // -------------------- Pagalbiniai metodai --------------------
        private string? GetCurrentUsername()
        {
            return User.FindFirst("username")?.Value   // ← TIKRAS claim
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("unique_name")?.Value
                ?? User.FindFirst("sub")?.Value;
        }

        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;
        private bool IsAdmin() => GetCurrentUserRole() == "Admin";
        private bool IsTrainer() => GetCurrentUserRole() == "Trainer";

        // 🔹 NAUJA: prisijungęs user su klientais
        private async Task<User?> GetCurrentUserWithClients()
        {
            var username = GetCurrentUsername();
            if (username == null) return null;

            return await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        // -------------------- GET: api/exercises --------------------
        // Svečias: tik trenerių
        // Member: savo + trenerių
        // Treneris: savo + trenerių + savo klientų
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetAll()
        {
            var query = _context.Exercises
                                .Include(e => e.User)
                                .Include(e => e.Workouts)
                                .AsQueryable();

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                // Svečias – tik trenerių pratimus
                return await query
                    .Where(e => e.User != null && e.User.Role == Role.Trainer)
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
                    .Where(e =>
                        // savo pratimai
                        e.Username == username
                        // trenerių pratimai
                        || (e.User != null && e.User.Role == Role.Trainer)
                        // klientų pratimai
                        || clientUsernames.Contains(e.Username))
                    .ToListAsync();
            }

            // Member – savo ir trenerių
            return await query
                .Where(e =>
                    e.Username == username
                    || (e.User != null && e.User.Role == Role.Trainer))
                .ToListAsync();
        }

        // -------------------- GET: api/exercises/{id} --------------------
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<Exercise>> Get(int id)
        {
            var exercise = await _context.Exercises
                                         .Include(e => e.User)
                                         .Include(e => e.Workouts)
                                         .Include(e => e.ExerciseTemplate)
                                         .FirstOrDefaultAsync(e => e.Id == id);

            if (exercise == null)
                return NotFound("Pratimas nerastas.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                // svečias – tik trenerių
                if (exercise.User == null || exercise.User.Role != Role.Trainer)
                    return Forbid();

                return Ok(exercise);
            }

            if (IsAdmin())
                return Ok(exercise);

            // savo pratimas
            if (exercise.Username == username)
                return Ok(exercise);

            // trenerio pratimas
            if (exercise.User?.Role == Role.Trainer)
                return Ok(exercise);

            // treneris – gali matyti savo kliento pratimą
            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                if (currentUser != null &&
                    currentUser.Clients.Any(c => c.Username == exercise.Username))
                {
                    return Ok(exercise);
                }
            }

            return Forbid();
        }

        // -------------------- POST: api/exercises --------------------
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Exercise>> Create(
            [FromBody] CreateExerciseRequest request,
            [FromQuery] List<int>? workoutIds)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var exercise = new Exercise
            {
                Username = username,
                Sets = request.Sets,
                Reps = request.Reps,
                Weight = request.Weight,
                Workouts = new List<Workout>()
            };

            // 1) Jeigu pasirinko šabloną
            if (request.ExerciseTemplateId.HasValue)
            {
                var template = await _context.ExerciseTemplates
                    .FirstOrDefaultAsync(t => t.Id == request.ExerciseTemplateId.Value);

                if (template == null)
                    return BadRequest("Neteisingas pratimo šablonas.");

                exercise.ExerciseTemplateId = template.Id;
                exercise.Name = template.Name;
                exercise.ImageUrl = template.ImageUrl;
            }
            else
            {
                // 2) Custom pratimas – turi būti pavadinimas
                if (string.IsNullOrWhiteSpace(request.Name))
                    return BadRequest("Nurodyk pratimo pavadinimą arba pasirink šabloną.");

                exercise.Name = request.Name;
                exercise.ImageUrl = "/exercises/custom-default.jpg";
            }

            if (workoutIds != null)
            {
                foreach (var wid in workoutIds)
                {
                    var workout = await _context.Workouts.FindAsync(wid);
                    if (workout != null)
                        exercise.Workouts.Add(workout);
                }
            }

            _context.Exercises.Add(exercise);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = exercise.Id }, exercise);
        }

        // -------------------- PUT: api/exercises/{id} --------------------
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateExerciseRequest request,
            [FromQuery] List<int>? workoutIds)
        {
            var existingExercise = await _context.Exercises
                                                .Include(e => e.Workouts)
                                                .FirstOrDefaultAsync(e => e.Id == id);

            if (existingExercise == null)
                return NotFound("Pratimas nerastas.");

            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            if (existingExercise.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && existingExercise.Username != username)
                return Forbid();

            // jei iš šablono – pavadinimo nekeičiam
            if (!existingExercise.ExerciseTemplateId.HasValue)
            {
                existingExercise.Name = request.Name;
            }

            existingExercise.Sets = request.Sets;
            existingExercise.Reps = request.Reps;
            existingExercise.Weight = request.Weight;

            if (workoutIds != null)
            {
                var currentWorkoutIds = existingExercise.Workouts.Select(w => w.Id).ToList();

                foreach (var wid in workoutIds.Except(currentWorkoutIds))
                {
                    var workout = await _context.Workouts.FindAsync(wid);
                    if (workout != null)
                        existingExercise.Workouts.Add(workout);
                }

                foreach (var wid in currentWorkoutIds.Except(workoutIds))
                {
                    var workout = existingExercise.Workouts.FirstOrDefault(w => w.Id == wid);
                    if (workout != null)
                        existingExercise.Workouts.Remove(workout);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(existingExercise);
        }

        // -------------------- DELETE: api/exercises/{id} --------------------
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null)
                return NotFound("Pratimas nerastas.");

            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            if (exercise.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && exercise.Username != username)
                return Forbid();

            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // -------------------- GET: api/exercises/byworkout/{workoutId} --------------------
        // (jei naudoji šitą endpoint'ą)
        [Authorize]
        [HttpGet("byworkout/{workoutId}")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetByWorkout(int workoutId)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                            .ThenInclude(e => e.User)
                                        .FirstOrDefaultAsync(w => w.Id == workoutId);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            // panaši logika kaip WorkoutsController.GetExercises
            if (IsAdmin() || workout.Username == username)
                return Ok(workout.Exercises);

            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                if (currentUser != null &&
                    currentUser.Clients.Any(c => c.Username == workout.Username))
                {
                    return Ok(workout.Exercises);
                }

                // trenerio treniruotės atveju
                if (workout.User?.Role == Role.Trainer)
                    return Ok(workout.Exercises);
            }

            // Member – tik savo arba trenerio treniruotė
            if (workout.User?.Role == Role.Trainer)
                return Ok(workout.Exercises);

            return Forbid();
        }
    }
}