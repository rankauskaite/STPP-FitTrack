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
    public class TrainingPlansController : ControllerBase
    {
        private readonly FitTrackDbContext _context;

        public TrainingPlansController(FitTrackDbContext context)
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


        // -------------------- GET: api/trainingplans --------------------
        // Svečias mato tik trenerių viešus planus
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingPlan>>> GetAll()
        {
            var query = _context.TrainingPlans
                                .Include(tp => tp.User)
                                .Include(tp => tp.Workouts)
                                    .ThenInclude(w => w.Exercises)
                                .AsQueryable();

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
                return await query.Where(tp => tp.IsPublic && tp.User != null && tp.User.Role == Role.Trainer).ToListAsync();

            if (IsAdmin())
                return await query.ToListAsync();

            if (IsTrainer())
                return await query.Where(tp =>
                    tp.IsPublic || tp.Username == username || (tp.User != null && tp.User.Role == Role.Trainer)).ToListAsync();

            // Member – savo + trenerių vieši planai
            return await query.Where(tp =>
                tp.Username == username || (tp.IsPublic && tp.User != null && tp.User.Role == Role.Trainer)).ToListAsync();
        }


        // -------------------- GET: api/trainingplans/{id} --------------------
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingPlan>> Get(int id)
        {
            var plan = await _context.TrainingPlans
                                     .Include(tp => tp.User)
                                     .Include(tp => tp.Workouts)
                                        .ThenInclude(w => w.Exercises)
                                     .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                return Ok(plan);

            if (!isAuthenticated)
                return Forbid();

            if (IsAdmin())
                return Ok(plan);

            if (plan.Username == username)
                return Ok(plan);

            if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                return Ok(plan);

            return Forbid();
        }


        // -------------------- POST: api/trainingplans --------------------
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<TrainingPlan>> Create([FromBody] TrainingPlan plan, [FromQuery] List<int>? workoutIds)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized("Vartotojas neautentifikuotas.");

            plan.Username = username;
            plan.Workouts = new List<Workout>();

            if (workoutIds != null)
            {
                foreach (var wid in workoutIds)
                {
                    var workout = await _context.Workouts.FindAsync(wid);
                    if (workout != null)
                        plan.Workouts.Add(workout);
                }
            }

            _context.TrainingPlans.Add(plan);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = plan.Id }, plan);
        }


        // -------------------- PUT: api/trainingplans/{id} --------------------
        // Redaguoti gali tik savus planus (admin – tik savo)
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TrainingPlan updatedPlan, [FromQuery] List<int>? workoutIds)
        {
            if (id != updatedPlan.Id)
                return BadRequest("ID neatitinka esamo plano.");

            var existing = await _context.TrainingPlans
                                         .Include(tp => tp.Workouts)
                                         .FirstOrDefaultAsync(tp => tp.Id == id);

            if (existing == null)
                return NotFound("Planas nerastas.");

            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            if (existing.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && existing.Username != username)
                return Forbid();

            existing.Name = updatedPlan.Name;
            existing.DurationWeeks = updatedPlan.DurationWeeks;
            existing.Type = updatedPlan.Type;
            existing.IsPublic = updatedPlan.IsPublic;

            if (workoutIds != null)
            {
                var workouts = await _context.Workouts
                                             .Where(w => workoutIds.Contains(w.Id))
                                             .ToListAsync();

                existing.Workouts.Clear();
                foreach (var w in workouts)
                    existing.Workouts.Add(w);
            }

            await _context.SaveChangesAsync();
            return Ok(existing);
        }


        // -------------------- DELETE: api/trainingplans/{id} --------------------
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var plan = await _context.TrainingPlans
                                     .Include(tp => tp.Workouts)
                                     .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            if (plan.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && plan.Username != username)
                return Forbid();

            plan.Workouts.Clear();
            _context.TrainingPlans.Remove(plan);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // -------------------- GET: api/trainingplans/{id}/workouts --------------------
        // Gali matyti savo ar trenerių planų treniruotes
        [Authorize]
        [HttpGet("{id}/workouts")]
        public async Task<ActionResult<IEnumerable<Workout>>> GetWorkouts(int id)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var plan = await _context.TrainingPlans
                                     .Include(tp => tp.User)
                                     .Include(tp => tp.Workouts)
                                         .ThenInclude(w => w.Exercises)
                                     .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            if (plan.Username != username && !IsAdmin() && plan.User?.Role != Role.Trainer)
                return Forbid();

            return Ok(plan.Workouts);
        }


        // -------------------- POST: api/trainingplans/{id}/add-workouts --------------------
        // Pridėti treniruotes į savo planą
        [Authorize]
        [HttpPost("{id}/add-workouts")]
        public async Task<IActionResult> AddWorkouts(int id, [FromQuery] List<int> workoutIds)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var plan = await _context.TrainingPlans
                                     .Include(tp => tp.Workouts)
                                     .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            if (plan.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && plan.Username != username)
                return Forbid();

            foreach (var wid in workoutIds)
            {
                var workout = await _context.Workouts.FindAsync(wid);
                if (workout != null && !plan.Workouts.Contains(workout))
                    plan.Workouts.Add(workout);
            }

            await _context.SaveChangesAsync();
            return Ok(plan.Workouts);
        }


        // -------------------- DELETE: api/trainingplans/{id}/workouts/{workoutId} --------------------
        // Pašalina treniruotę iš plano, bet jos neištrina iš DB
        [Authorize]
        [HttpDelete("{id}/workouts/{workoutId}")]
        public async Task<IActionResult> RemoveWorkout(int id, int workoutId)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var plan = await _context.TrainingPlans
                                     .Include(tp => tp.Workouts)
                                     .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            if (plan.Username != username && !IsAdmin())
                return Forbid();

            if (IsAdmin() && plan.Username != username)
                return Forbid();

            var workout = plan.Workouts.FirstOrDefault(w => w.Id == workoutId);
            if (workout == null)
                return NotFound("Treniruotė nerasta plane.");

            plan.Workouts.Remove(workout);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}