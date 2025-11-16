using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;

namespace FitTrackAPI.Controllers
{
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
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("unique_name")?.Value
                ?? User.FindFirst("sub")?.Value;
        }

        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;
        private bool IsAdmin() => GetCurrentUserRole() == "Admin";
        private bool IsTrainer() => GetCurrentUserRole() == "Trainer";


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
                return await query.Where(w => w.User != null && w.User.Role == Role.Trainer).ToListAsync();
            }

            if (IsAdmin())
                return await query.ToListAsync();

            if (IsTrainer())
                return await query.Where(w => (w.User != null && w.User.Role == Role.Trainer) || w.Username == username).ToListAsync();

            // Member – savo ir trenerių treniruotes
            return await query.Where(w => w.Username == username || (w.User != null && w.User.Role == Role.Trainer)).ToListAsync();
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
                if (workout.User?.Role != Role.Trainer)
                    return Forbid();
            }
            else if (!IsAdmin() && workout.Username != username && workout.User?.Role != Role.Trainer)
            {
                return Forbid();
            }

            return Ok(workout);
        }


        // -------------------- POST: api/workouts --------------------
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Workout>> Create([FromBody] Workout workout, [FromQuery] List<int>? planIds)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            workout.Username = username;
            workout.TrainingPlans = new List<TrainingPlan>();

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
        public async Task<IActionResult> Update(int id, [FromBody] Workout updatedWorkout, [FromQuery] List<int>? planIds)
        {
            if (id != updatedWorkout.Id)
                return BadRequest("ID neatitinka esamos treniruotės.");

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

            existing.Date = updatedWorkout.Date;
            existing.Type = updatedWorkout.Type;
            existing.DurationMinutes = updatedWorkout.DurationMinutes;
            existing.CaloriesBurned = updatedWorkout.CaloriesBurned;

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
        [Authorize]
        [HttpGet("{id}/exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises(int id)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .Include(w => w.User)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            if (!IsAdmin() && workout.Username != username && workout.User?.Role != Role.Trainer)
                return Forbid();

            return Ok(workout.Exercises);
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