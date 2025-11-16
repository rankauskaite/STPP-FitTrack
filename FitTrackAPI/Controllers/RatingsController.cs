using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;

namespace FitTrackAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        public RatingsController(FitTrackDbContext context) => _context = context;

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


        // -------------------- POST: api/ratings --------------------
        [Authorize(Roles = "Member,Trainer,Admin")]
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

            // Patikrinam, ar vertina planą
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

            // Jeigu jau vertino – atnaujina
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

            return CreatedAtAction(nameof(GetByPlan), new { planId = rating.TrainingPlanId }, rating);
        }


        // -------------------- PUT: api/ratings/{id} --------------------
        [Authorize(Roles = "Member,Trainer,Admin")]
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
        [Authorize(Roles = "Member,Trainer,Admin")]
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


        // -------------------- GET: api/ratings/plan/{planId} --------------------
        [AllowAnonymous]
        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<IEnumerable<Rating>>> GetByPlan(int planId)
        {
            var plan = await _context.TrainingPlans
                .Include(tp => tp.User)
                .FirstOrDefaultAsync(tp => tp.Id == planId);

            if (plan == null)
                return NotFound("Planas nerastas.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                if (!plan.IsPublic || plan.User == null || plan.User.Role != Role.Trainer)
                    return Forbid();
            }

            if (!IsAdmin() && username != plan.Username && !plan.IsPublic &&
                (plan.User == null || plan.User.Role != Role.Trainer))
                return Forbid();

            var ratings = await _context.Ratings
                .Include(r => r.User)
                .Where(r => r.TrainingPlanId == planId)
                .ToListAsync();

            return Ok(ratings);
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

            return Ok(Math.Round(avg, 2));
        }
    }
}