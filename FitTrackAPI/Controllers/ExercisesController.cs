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
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("unique_name")?.Value
                ?? User.FindFirst("sub")?.Value;
        }

        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;
        private bool IsAdmin() => GetCurrentUserRole() == "Admin";
        private bool IsTrainer() => GetCurrentUserRole() == "Trainer";


        // -------------------- GET: api/exercises --------------------
        // Svečias mato tik trenerių pratimus, prisijungęs – savo + trenerių
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
                return await query.Where(e => e.User != null && e.User.Role == Role.Trainer).ToListAsync();
            }

            // Prisijungęs vartotojas
            if (IsAdmin())
                return await query.ToListAsync();

            if (IsTrainer())
                return await query.Where(e => (e.User != null && e.User.Role == Role.Trainer) || e.Username == username).ToListAsync();

            // Member – savo ir trenerių
            return await query.Where(e => e.Username == username || (e.User != null && e.User.Role == Role.Trainer)).ToListAsync();
        }


        // -------------------- GET: api/exercises/{id} --------------------
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<Exercise>> Get(int id)
        {
            var exercise = await _context.Exercises
                                         .Include(e => e.User)
                                         .Include(e => e.Workouts)
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
            }
            else if (!IsAdmin() && exercise.Username != username && (exercise.User == null || exercise.User.Role != Role.Trainer))
            {
                // Prisijungęs – tik savo ar trenerių
                return Forbid();
            }

            return Ok(exercise);
        }


        // -------------------- POST: api/exercises --------------------
        // Kurti gali bet kuris prisijungęs
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Exercise>> Create([FromBody] Exercise exercise, [FromQuery] List<int>? workoutIds)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            exercise.Username = username;
            exercise.Workouts = new List<Workout>();

            if (workoutIds != null)
            {
                foreach (var wid in workoutIds)
                {
                    var workout = await _context.Workouts.FindAsync(wid);
                    if (workout != null) exercise.Workouts.Add(workout);
                }
            }

            _context.Exercises.Add(exercise);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = exercise.Id }, exercise);
        }


        // -------------------- PUT: api/exercises/{id} --------------------
        // Redaguoti gali tik savo pratimus, admin – tik savo
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Exercise updatedExercise, [FromQuery] List<int>? workoutIds)
        {
            if (id != updatedExercise.Id)
                return BadRequest("ID neatitinka esamo pratimo.");

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

            // Admin gali redaguoti tik savo
            if (IsAdmin() && existingExercise.Username != username)
                return Forbid();

            existingExercise.Name = updatedExercise.Name;
            existingExercise.Sets = updatedExercise.Sets;
            existingExercise.Reps = updatedExercise.Reps;
            existingExercise.Weight = updatedExercise.Weight;

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
        // Trinti gali tik savo pratimus, admin – tik savo
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
        // Prisijungęs mato savo ir trenerių pratimus pagal treniruotę
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

            var visibleExercises = workout.Exercises
                .Where(e => e.Username == username || (e.User != null && e.User.Role == Role.Trainer))
                .ToList();

            return Ok(visibleExercises);
        }
    }
}