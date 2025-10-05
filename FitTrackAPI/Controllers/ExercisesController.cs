using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;

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

        // GET: api/exercises
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetAll()
        {
            return await _context.Exercises
                                 .Include(e => e.Workouts)
                                 .ToListAsync();
        }

        // GET: api/exercises/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Exercise>> Get(int id)
        {
            var exercise = await _context.Exercises
                                         .Include(e => e.Workouts)
                                         .FirstOrDefaultAsync(e => e.Id == id);

            if (exercise == null)
                return NotFound();

            return exercise;
        }

        // POST: api/exercises
        [HttpPost]
        public async Task<ActionResult<Exercise>> Create(Exercise exercise, [FromQuery] List<int>? workoutIds)
        {
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

        // PUT: api/exercises/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Exercise updatedExercise, [FromQuery] List<int>? workoutIds)
        {
            // Patikriname, ar ID atitinka
            if (id != updatedExercise.Id)
                return BadRequest("ID neatitinka esamo pratimo.");

            // Ieškome egzistuojančio pratimo su susijusiomis treniruotėmis
            var existingExercise = await _context.Exercises
                                                .Include(e => e.Workouts)
                                                .FirstOrDefaultAsync(e => e.Id == id);

            if (existingExercise == null)
                return NotFound("Pratimas nerastas.");

            // ✅ Atnaujiname tik laukus, nepatrinant įrašo
            existingExercise.Name = updatedExercise.Name;
            existingExercise.Sets = updatedExercise.Sets;
            existingExercise.Reps = updatedExercise.Reps;
            existingExercise.Weight = updatedExercise.Weight;

            // ✅ Atnaujiname ryšį su treniruotėmis (tik pakeičiame sąrašą, neištrindami įrašo)
            if (workoutIds != null)
            {
                var currentWorkoutIds = existingExercise.Workouts.Select(w => w.Id).ToList();

                // Pridedame naujas treniruotes, jei dar nėra
                foreach (var wid in workoutIds.Except(currentWorkoutIds))
                {
                    var workout = await _context.Workouts.FindAsync(wid);
                    if (workout != null)
                        existingExercise.Workouts.Add(workout);
                }

                // Pašaliname tik tas treniruotes, kurios nebėra sąraše
                foreach (var wid in currentWorkoutIds.Except(workoutIds))
                {
                    var workout = existingExercise.Workouts.FirstOrDefault(w => w.Id == wid);
                    if (workout != null)
                        existingExercise.Workouts.Remove(workout);
                }
            }

            // ✅ Pažymime, kad objektas buvo redaguotas
            _context.Entry(existingExercise).State = EntityState.Modified;

            // ✅ Išsaugome pakeitimus
            await _context.SaveChangesAsync();

            return Ok(existingExercise);
        }

        // DELETE: api/exercises/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null)
                return NotFound();

            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/exercises/byworkout/{workoutId}
        [HttpGet("byworkout/{workoutId}")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetByWorkout(int workoutId)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.Exercises)
                                        .FirstOrDefaultAsync(w => w.Id == workoutId);
            return workout == null || workout.Exercises.Count == 0 ? NotFound() : Ok(workout.Exercises);
        }
    }
}
