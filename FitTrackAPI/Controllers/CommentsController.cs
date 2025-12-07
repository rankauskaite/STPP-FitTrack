using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace FitTrackAPI.Controllers
{
    public class CreateCommentDto
    {
        public string Text { get; set; } = string.Empty;
        public int? TrainingPlanId { get; set; }
        public int? WorkoutId { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        public CommentsController(FitTrackDbContext context) => _context = context;

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

        // -------------------- POST: api/comments --------------------
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCommentDto model)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.Clients)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null) return Unauthorized();

            bool canComment = false;

            // ----- Komentarai PLANAMS -----
            if (model.TrainingPlanId.HasValue)
            {
                var plan = await _context.TrainingPlans
                    .Include(tp => tp.User)
                    .FirstOrDefaultAsync(tp => tp.Id == model.TrainingPlanId.Value);

                if (plan == null) return NotFound("Treniruočių planas nerastas.");

                if (plan.Username == username)
                    canComment = true;

                if (plan.IsPublic && plan.User?.Role == Role.Trainer)
                    canComment = true;

                if (IsTrainer() &&
                    (plan.Username == username ||
                     user.Clients.Any(c => c.Username == plan.Username)))
                    canComment = true;

                if (IsAdmin()) canComment = true;
            }

            // ----- Komentarai TRENIRUOTĖMS -----
            if (model.WorkoutId.HasValue)
            {
                var workout = await _context.Workouts
                    .Include(w => w.User)
                    .FirstOrDefaultAsync(w => w.Id == model.WorkoutId.Value);

                if (workout == null) return NotFound("Treniruotė nerasta.");

                var isOwner = workout.Username == username;
                var ownerIsTrainer = workout.User?.Role == Role.Trainer;

                if (isOwner)
                    canComment = true;

                if (ownerIsTrainer)
                    canComment = true;

                if (IsTrainer() || IsAdmin())
                    canComment = true;
            }

            if (!canComment)
                return Forbid("Neturi teisės komentuoti šio elemento.");

            var comment = new Comment
            {
                Text = model.Text.Trim(),
                TrainingPlanId = model.TrainingPlanId,
                WorkoutId = model.WorkoutId,
                Username = username,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return Ok(comment);
        }

        // -------------------- PUT: api/comments/{id} --------------------
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Comment updated)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return NotFound("Komentaras nerastas.");

            if (comment.Username != username)
                return Forbid("Gali redaguoti tik savo komentarus.");

            comment.Text = updated.Text;
            comment.CreatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(comment);
        }

        // -------------------- DELETE: api/comments/{id} --------------------
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var username = GetCurrentUsername();
            if (username == null) return Unauthorized();

            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return NotFound();

            if (!IsAdmin() && comment.Username != username)
                return Forbid("Gali trinti tik savo komentarus.");

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // -------------------- GET: api/comments/plan/{planId} --------------------
        [AllowAnonymous]
        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetByPlan(int planId)
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

            return await _context.Comments
                .Include(c => c.User)
                .Where(c => c.TrainingPlanId == planId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        // -------------------- GET: api/comments/workout/{workoutId} --------------------
        [AllowAnonymous]
        [HttpGet("workout/{workoutId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetByWorkout(int workoutId)
        {
            var workout = await _context.Workouts
                                        .Include(w => w.User)
                                        .FirstOrDefaultAsync(w => w.Id == workoutId);
            if (workout == null)
                return NotFound("Treniruotė nerasta.");

            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            var username = GetCurrentUsername();

            if (!isAuthenticated)
            {
                if (workout.User?.Role != Role.Trainer)
                    return Forbid();
            }
            else
            {
                if (IsAdmin() || username == workout.Username)
                {
                    // ok
                }
                else if (workout.User?.Role == Role.Trainer)
                {
                    // trenerio treniruotė – matoma prisijungusiems
                }
                else if (IsTrainer())
                {
                    var currentUser = await GetCurrentUserWithClients();
                    if (currentUser == null ||
                        !currentUser.Clients.Any(c => c.Username == workout.Username))
                    {
                        return Forbid();
                    }
                }
                else
                {
                    return Forbid();
                }
            }

            return await _context.Comments
                .Include(c => c.User)
                .Where(c => c.WorkoutId == workoutId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }
    }
}