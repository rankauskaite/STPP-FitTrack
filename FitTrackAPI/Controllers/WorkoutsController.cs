using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;

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

        // GET: api/workouts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Workout>>> GetAll()
        {
            return await _context.Workouts
                                 .Include(w => w.Exercises)
                                 .Include(w => w.TrainingPlans)
                                 .ToListAsync();
        }

        // GET: api/workouts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Workout>> Get(int id)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .Include(w => w.TrainingPlans)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound();

            return workout;
        }

        // POST: api/workouts
        [HttpPost]
        public async Task<ActionResult<Workout>> Create(Workout workout, [FromQuery] List<int>? planIds)
        {
            workout.TrainingPlans = new List<TrainingPlan>();

            if (planIds != null)
            {
                foreach (var pid in planIds)
                {
                    var plan = await _context.TrainingPlans.FindAsync(pid);
                    if (plan != null) workout.TrainingPlans.Add(plan);
                }
            }

            _context.Workouts.Add(workout);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = workout.Id }, workout);
        }

        // PUT: api/workouts/{id}
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

            // ✅ Atnaujiname laukus
            existing.Date = updatedWorkout.Date;
            existing.Type = updatedWorkout.Type;
            existing.DurationMinutes = updatedWorkout.DurationMinutes;
            existing.CaloriesBurned = updatedWorkout.CaloriesBurned;

            // ✅ Atnaujiname ryšį su treniruočių planais (nepatrinant visko)
            if (planIds != null)
            {
                var currentPlanIds = existing.TrainingPlans.Select(p => p.Id).ToList();

                // Pridedame naujus planus
                foreach (var pid in planIds.Except(currentPlanIds))
                {
                    var plan = await _context.TrainingPlans.FindAsync(pid);
                    if (plan != null)
                        existing.TrainingPlans.Add(plan);
                }

                // Pašaliname planus, kurie nebėra sąraše
                foreach (var pid in currentPlanIds.Except(planIds))
                {
                    var plan = existing.TrainingPlans.FirstOrDefault(p => p.Id == pid);
                    if (plan != null)
                        existing.TrainingPlans.Remove(plan);
                }
            }

            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        // DELETE: api/workouts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var workout = await _context.Workouts.FindAsync(id);
            if (workout == null)
                return NotFound();

            _context.Workouts.Remove(workout);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises(int id)
        {
            var workout = await _context.Workouts.Include(w => w.Exercises)
                                                 .FirstOrDefaultAsync(w => w.Id == id);
            return workout == null || workout.Exercises.Count == 0 ? NotFound() : Ok(workout.Exercises);
        }

        // ✅ Naujas endpoint: pridėti pratimus prie treniruotės
        [HttpPost("{id}/add-exercises")]
        public async Task<IActionResult> AddExercises(int id, [FromQuery] List<int> exerciseIds)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

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

        // DELETE: api/workouts/{id}/exercises
        [HttpDelete("{id}/exercises")]
        public async Task<IActionResult> RemoveExercises(int id, [FromQuery] List<int> exerciseIds)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

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
                return NotFound("Jokie pratimai nerasti treniruotėje.");

            await _context.SaveChangesAsync();
            return NoContent(); // grąžiname 204, nes resursas buvo pakeistas, bet body nereikalingas
        }
    }
}
