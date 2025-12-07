using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;

namespace FitTrackAPI.Controllers
{
    public class CreateTrainingPlanRequest
    {
        public string Name { get; set; } = null!;
        public int DurationWeeks { get; set; }
        public string Type { get; set; } = null!;
        public bool IsPublic { get; set; }
    }

    public class UpdateTrainingPlanRequest
    {
        public string Name { get; set; } = null!;
        public int DurationWeeks { get; set; }
        public string Type { get; set; } = null!;
        public bool IsPublic { get; set; }
    }

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
            return User.FindFirst("username")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("unique_name")?.Value
                ?? User.FindFirst("sub")?.Value;
        }

        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;
        private bool IsAdmin() => GetCurrentUserRole() == "Admin";
        private bool IsTrainer() => GetCurrentUserRole() == "Trainer";

        // 🔹 NAUJA: grąžina prisijungusį user su Clients
        private async Task<User?> GetCurrentUserWithClients()
        {
            var username = GetCurrentUsername();
            if (username == null) return null;

            return await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        // -------------------- GET: api/trainingplans --------------------
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

            // Svečias – tik trenerių vieši planai
            if (!isAuthenticated)
            {
                return await query
                    .Where(tp => tp.IsPublic && tp.User != null && tp.User.Role == Role.Trainer)
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
                    .Where(tp =>
                        // savo planai
                        tp.Username == username
                        // kitų trenerių vieši planai
                        || (tp.IsPublic && tp.User != null && tp.User.Role == Role.Trainer)
                        // savo klientų planai
                        || clientUsernames.Contains(tp.Username))
                    .ToListAsync();
            }

            // Member – savo + trenerių vieši planai
            return await query.Where(tp =>
                tp.Username == username
                || (tp.IsPublic && tp.User != null && tp.User.Role == Role.Trainer))
                .ToListAsync();
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

            // Viešas trenerio planas – matomas visiems
            if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                return Ok(plan);

            if (!isAuthenticated)
                return Forbid();

            if (IsAdmin())
                return Ok(plan);

            // savas planas
            if (plan.Username == username)
                return Ok(plan);

            // jei treneris – tikriname ar planas priklauso jo klientui
            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                if (currentUser != null &&
                    currentUser.Clients.Any(c => c.Username == plan.Username))
                {
                    return Ok(plan);
                }
            }

            // jei dar kartą: viešas trenerio planas (saugumo sumetimais)
            if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                return Ok(plan);

            return Forbid();
        }

        // -------------------- POST: api/trainingplans --------------------
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<TrainingPlan>> Create(
            [FromBody] CreateTrainingPlanRequest request,
            [FromQuery] List<int>? workoutIds)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized("Vartotojas neautentifikuotas.");

            var plan = new TrainingPlan
            {
                Name = request.Name,
                DurationWeeks = request.DurationWeeks,
                Type = request.Type,
                IsPublic = request.IsPublic,
                Username = username,
                Workouts = new List<Workout>()
            };

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
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateTrainingPlanRequest request,
            [FromQuery] List<int>? workoutIds)
        {
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

            existing.Name = request.Name;
            existing.DurationWeeks = request.DurationWeeks;
            existing.Type = request.Type;
            existing.IsPublic = request.IsPublic;

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
        // DABAR: savininkas, admin ir treneris, jei planas priklauso jo klientui
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

            if (IsAdmin())
                return Ok(plan.Workouts);

            // savininkas
            if (plan.Username == username)
                return Ok(plan.Workouts);

            if (IsTrainer())
            {
                var currentUser = await GetCurrentUserWithClients();
                if (currentUser != null &&
                    currentUser.Clients.Any(c => c.Username == plan.Username))
                {
                    return Ok(plan.Workouts);
                }
            }

            // papildomai leisk trenerio viešiems planams (jei norisi)
            if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                return Ok(plan.Workouts);

            return Forbid();
        }

        // -------------------- POST: api/trainingplans/{id}/add-workouts --------------------
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

        // -------------------- GET: api/trainingplans/top-rated --------------------
        [AllowAnonymous]
        [HttpGet("top-rated")]
        public async Task<IActionResult> GetTopRatedPlans()
        {
            var plans = await _context.TrainingPlans
                .Include(tp => tp.User)
                .Where(tp => tp.IsPublic && tp.User != null && tp.User.Role == Role.Trainer)
                .ToListAsync();

            var ratings = await _context.Ratings.ToListAsync();

            var result = plans
                .Select(plan =>
                {
                    var planRatings = ratings
                        .Where(r => r.TrainingPlanId == plan.Id)
                        .Select(r => r.Score);

                    double avg = planRatings.Any()
                        ? Math.Round(planRatings.Average(), 2)
                        : 0;

                    return new
                    {
                        plan.Id,
                        Name = plan.Name,
                        Type = plan.Type,
                        DurationWeeks = plan.DurationWeeks,
                        Username = plan.Username,
                        AverageRating = avg,
                        RatingCount = planRatings.Count(),
                        ImageUrl = plan.ImageUrl ?? "/trainingPlans/defaultTrainingPlan.jpg"
                    };
                })
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.RatingCount)
                .Take(6)
                .ToList();

            return Ok(result);
        }
    }
}