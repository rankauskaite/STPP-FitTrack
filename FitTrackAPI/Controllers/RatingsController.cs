using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FitTrackAPI.Controllers
{
    // ---- DTO'AI reitingams už treniruotes ----
    public class RateWorkoutRequest
    {
        public int Score { get; set; } // 1–5
    }

    public class WorkoutRatingSummary
    {
        public double? AverageScore { get; set; }
        public int RatingsCount { get; set; }
        public int? UserScore { get; set; }
    }

    public class TrainingPlanRatingSummary
    {
        public double? AverageScore { get; set; }
        public int RatingsCount { get; set; }
        public int? UserScore { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        public RatingsController(FitTrackDbContext context) => _context = context;

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

        // -------------------- POST: api/ratings --------------------
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddRating([FromBody] Rating rating)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized("Vartotojas neautentifikuotas.");

            if (rating.Score < 1 || rating.Score > 5)
                return BadRequest("Įvertinimas turi būti tarp 1 ir 5.");

            var user = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return Unauthorized();

            bool canRate = false;

            if (rating.TrainingPlanId != 0)
            {
                var plan = await _context.TrainingPlans
                    .Include(tp => tp.User)
                    .FirstOrDefaultAsync(tp => tp.Id == rating.TrainingPlanId);

                if (plan == null)
                    return NotFound("Planas nerastas.");

                if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                    canRate = true;

                if (plan.Username == username)
                    canRate = true;

                if (IsTrainer() && user.Clients.Any(c => c.Username == plan.Username))
                    canRate = true;

                if (IsAdmin())
                    canRate = true;
            }

            if (!canRate)
                return Forbid("Neturi teisės vertinti šio plano.");

            rating.Username = username;

            var existing = await _context.Ratings.FirstOrDefaultAsync(r =>
                r.Username == rating.Username && r.TrainingPlanId == rating.TrainingPlanId);

            if (existing != null)
            {
                existing.Score = rating.Score;
                await _context.SaveChangesAsync();
                return Ok(existing);
            }

            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrainingPlanRating), new { planId = rating.TrainingPlanId }, rating);
        }

        // -------------------- PUT: api/ratings/{id} --------------------
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Rating updated)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var rating = await _context.Ratings.FindAsync(id);
            if (rating == null)
                return NotFound("Įvertinimas nerastas.");

            if (rating.Username != username)
                return Forbid("Gali redaguoti tik savo įvertinimus.");

            if (updated.Score < 1 || updated.Score > 5)
                return BadRequest("Įvertinimas turi būti tarp 1 ir 5.");

            rating.Score = updated.Score;
            await _context.SaveChangesAsync();

            return Ok(rating);
        }

        // -------------------- DELETE: api/ratings/{id} --------------------
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var rating = await _context.Ratings.FindAsync(id);
            if (rating == null)
                return NotFound();

            if (!IsAdmin() && rating.Username != username)
                return Forbid("Gali trinti tik savo įvertinimus.");

            if (IsAdmin() && rating.Username != username)
                return Forbid("Administratorius negali trinti kitų įvertinimų.");

            _context.Ratings.Remove(rating);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // -------------------- GET: api/trainingplans/{id}/rating --------------------
        [AllowAnonymous]
        [HttpGet("/api/trainingplans/{id}/rating")]
        public async Task<ActionResult<TrainingPlanRatingSummary>> GetTrainingPlanRating(int id)
        {
            var plan = await _context.TrainingPlans
                .Include(tp => tp.User)
                .FirstOrDefaultAsync(tp => tp.Id == id);

            if (plan == null)
                return NotFound("Planas nerastas.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                if (!plan.IsPublic || plan.User == null || plan.User.Role != Role.Trainer)
                    return Forbid();
            }
            else
            {
                if (IsAdmin() || username == plan.Username)
                {
                    // ok
                }
                else if (plan.IsPublic && plan.User != null && plan.User.Role == Role.Trainer)
                {
                    // viešas trenerio planas
                }
                else if (IsTrainer())
                {
                    var currentUser = await GetCurrentUserWithClients();
                    if (currentUser == null ||
                        !currentUser.Clients.Any(c => c.Username == plan.Username))
                    {
                        return Forbid();
                    }
                }
                else
                {
                    return Forbid();
                }
            }

            var ratingsQuery = _context.Ratings.Where(r => r.TrainingPlanId == id);

            var ratingsCount = await ratingsQuery.CountAsync();
            double? avg = ratingsCount == 0
                ? (double?)null
                : await ratingsQuery.AverageAsync(r => r.Score);

            int? userScore = null;
            if (!string.IsNullOrEmpty(username))
            {
                userScore = await ratingsQuery
                    .Where(r => r.Username == username)
                    .Select(r => (int?)r.Score)
                    .FirstOrDefaultAsync();
            }

            var result = new TrainingPlanRatingSummary
            {
                AverageScore = avg,
                RatingsCount = ratingsCount,
                UserScore = userScore
            };

            return Ok(result);
        }

        // -------------------- GET: api/ratings/average/plan/{planId} --------------------
        [AllowAnonymous]
        [HttpGet("average/plan/{planId}")]
        public async Task<ActionResult<double>> GetAverage(int planId)
        {
            var plan = await _context.TrainingPlans
                .Include(tp => tp.User)
                .FirstOrDefaultAsync(tp => tp.Id == planId);

            if (plan == null)
                return NotFound("Planas nerastas.");

            if (!plan.IsPublic && (plan.User == null || plan.User.Role != Role.Trainer))
            {
                var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
                var username = GetCurrentUsername();
                if (!isAuthenticated || username != plan.Username)
                    return Forbid();
            }

            var avg = await _context.Ratings
                .Where(r => r.TrainingPlanId == planId)
                .AverageAsync(r => (double?)r.Score) ?? 0;

            return Ok(System.Math.Round(avg, 2));
        }

        // =====================================================================
        //             R A T I N G A I   U Ž   T R E N I R U O T E S
        // =====================================================================

        // GET: api/workouts/{id}/rating
        [AllowAnonymous]
        [HttpGet("/api/workouts/{id}/rating")]
        public async Task<ActionResult<WorkoutRatingSummary>> GetWorkoutRating(int id)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.User)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            // ❌ NEBEdarom BadRequest, jeigu ne trenerio treniruotė
            // Tiesiog parodysim tuščią suvestinę (0 įvertinimų)

            var ratingsQuery = _context.Ratings.Where(r => r.WorkoutId == id);

            var ratingsCount = await ratingsQuery.CountAsync();
            double? avg = ratingsCount == 0
                ? (double?)null
                : await ratingsQuery.AverageAsync(r => r.Score);

            int? userScore = null;
            var username = GetCurrentUsername();
            if (!string.IsNullOrEmpty(username))
            {
                userScore = await ratingsQuery
                    .Where(r => r.Username == username)
                    .Select(r => (int?)r.Score)
                    .FirstOrDefaultAsync();
            }

            var result = new WorkoutRatingSummary
            {
                AverageScore = avg,
                RatingsCount = ratingsCount,
                UserScore = userScore
            };

            return Ok(result);
        }

        // POST: api/workouts/{id}/rating
        [Authorize]
        [HttpPost("/api/workouts/{id}/rating")]
        public async Task<ActionResult<WorkoutRatingSummary>> RateWorkout(int id, [FromBody] RateWorkoutRequest request)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            if (request.Score < 1 || request.Score > 5)
                return BadRequest("Įvertinimas turi būti tarp 1 ir 5.");

            var workout = await _context.Workouts
                                        .Include(w => w.User)
                                        .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            if (workout.User?.Role != Role.Trainer)
                return BadRequest("Vertinti galima tik trenerių treniruotes.");

            if (workout.Username == username)
                return BadRequest("Negali vertinti savo treniruotės.");

            var existing = await _context.Ratings
                .FirstOrDefaultAsync(r => r.WorkoutId == id && r.Username == username);

            if (existing == null)
            {
                var rating = new Rating
                {
                    Username = username,
                    WorkoutId = id,
                    Score = request.Score
                };
                _context.Ratings.Add(rating);
            }
            else
            {
                existing.Score = request.Score;
            }

            await _context.SaveChangesAsync();

            return await GetWorkoutRating(id);
        }

        // DELETE: api/workouts/{id}/rating
        [Authorize]
        [HttpDelete("/api/workouts/{id}/rating")]
        public async Task<IActionResult> DeleteWorkoutRating(int id)
        {
            var username = GetCurrentUsername();
            if (username == null)
                return Unauthorized();

            var rating = await _context.Ratings
                .FirstOrDefaultAsync(r => r.WorkoutId == id && r.Username == username);

            if (rating == null)
                return NotFound("Dar nebuvai įvertinęs šios treniruotės.");

            _context.Ratings.Remove(rating);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}