using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;

namespace FitTrackAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrainingPlansController : ControllerBase
    {
        private readonly FitTrackDbContext _context;

        public TrainingPlansController(FitTrackDbContext context)
        {
            _context = context;
        }

        // GET: api/trainingplans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingPlan>>> GetAll()
        {
            return await _context.TrainingPlans
                                 .Include(tp => tp.Workouts)
                                 .ThenInclude(w => w.Exercises)
                                 .ToListAsync();
        }

        // GET: api/trainingplans/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingPlan>> Get(int id)
        {
            var plan = await _context.TrainingPlans
                                     .Include(tp => tp.Workouts)
                                     .ThenInclude(w => w.Exercises)
                                     .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound();

            return plan;
        }

        // POST: api/trainingplans
        [HttpPost]
        public async Task<ActionResult<TrainingPlan>> Create([FromBody] TrainingPlan plan, [FromQuery] List<int>? workoutIds)
        {
            // Patikriname, ar vartotojas egzistuoja
            var userExists = await _context.Users.AnyAsync(u => u.Id == plan.UserId);
            if (!userExists)
                return BadRequest("Nurodytas vartotojas neegzistuoja.");

            plan.Workouts = new List<Workout>();

            if (workoutIds != null)
            {
                foreach (var wid in workoutIds)
                {
                    var workout = await _context.Workouts.FindAsync(wid);
                    if (workout != null) plan.Workouts.Add(workout);
                }
            }

            _context.TrainingPlans.Add(plan);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = plan.Id }, plan);
        }

        // PUT: api/trainingplans/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TrainingPlan updatedPlan, [FromQuery] List<int>? workoutIds)
        {
            if (updatedPlan == null || id != updatedPlan.Id)
                return BadRequest("Neteisingas planas arba ID.");

            var existing = await _context.TrainingPlans
                                        .Include(tp => tp.Workouts)
                                        .FirstOrDefaultAsync(tp => tp.Id == id);

            if (existing == null)
                return NotFound("Planas nerastas.");

            // Atnaujiname pagrindinius laukus
            existing.Name = updatedPlan.Name;
            existing.DurationWeeks = updatedPlan.DurationWeeks;
            existing.Type = updatedPlan.Type;
            existing.UserId = updatedPlan.UserId;
            existing.IsPublic = updatedPlan.IsPublic;

            // Atnaujiname treniruotes
            if (workoutIds != null)
            {
                var workouts = await _context.Workouts
                                            .Where(w => workoutIds.Contains(w.Id))
                                            .ToListAsync();

                var workoutList = existing.Workouts.ToList(); // konvertuojame į List

                // Pašaliname nebereikalingas treniruotes
                workoutList.RemoveAll(w => !workoutIds.Contains(w.Id));

                // Išvalome originalią kolekciją ir pridedame naują
                existing.Workouts.Clear();
                foreach (var w in workoutList)
                    existing.Workouts.Add(w);

                // Pridedame naujas, kurių dar nėra
                foreach (var w in workouts)
                {
                    if (!existing.Workouts.Any(ew => ew.Id == w.Id))
                        existing.Workouts.Add(w);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/trainingplans/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var plan = await _context.TrainingPlans
                                    .Include(tp => tp.Workouts)
                                    .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            // Pašaliname ryšius su treniruotėmis prieš trynimą
            plan.Workouts.Clear();

            _context.TrainingPlans.Remove(plan);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/workouts")]
        public async Task<ActionResult<IEnumerable<Workout>>> GetWorkouts(int id)
        {
            var plan = await _context.TrainingPlans.Include(tp => tp.Workouts)
                                                   .ThenInclude(w => w.Exercises)
                                                   .FirstOrDefaultAsync(tp => tp.Id == id);
            return plan == null || plan.Workouts.Count == 0 ? NotFound() : Ok(plan.Workouts);
        }

        // Vieši planai (visi mato)
        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<TrainingPlan>>> GetPublicPlans()
        {
            return await _context.TrainingPlans
                .Where(tp => tp.IsPublic)
                .ToListAsync();
        }

        // Patvirtinti planą (administratorius)
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApprovePlan(int id)
        {
            var plan = await _context.TrainingPlans.FindAsync(id);
            if (plan == null) return NotFound();
            plan.IsApproved = true;
            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        // POST: api/trainingplans/{id}/add-workouts
        [HttpPost("{id}/add-workouts")]
        public async Task<IActionResult> AddWorkouts(int id, [FromQuery] List<int> workoutIds)
        {
            var plan = await _context.TrainingPlans
                                    .Include(tp => tp.Workouts)
                                    .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            foreach (var wid in workoutIds)
            {
                var workout = await _context.Workouts.FindAsync(wid);
                if (workout != null && !plan.Workouts.Contains(workout))
                {
                    plan.Workouts.Add(workout);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(plan.Workouts);
        }

        [HttpDelete("{id}/workouts/{workoutId}")]
        public async Task<IActionResult> DeleteWorkoutFromPlan(int id, int workoutId)
        {
            var plan = await _context.TrainingPlans
                                    .Include(tp => tp.Workouts)
                                    .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null) return NotFound("Planas nerastas.");

            var workout = plan.Workouts.FirstOrDefault(w => w.Id == workoutId);
            if (workout == null) return NotFound("Treniruotė nerasta plane.");

            plan.Workouts.Remove(workout);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
