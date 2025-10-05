using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;

namespace FitTrackAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        public CommentsController(FitTrackDbContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> Create(Comment comment)
        {
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return Ok(comment);
        }

        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetByPlan(int planId)
            => await _context.Comments.Where(c => c.TrainingPlanId == planId).ToListAsync();

        [HttpGet("workout/{workoutId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetByWorkout(int workoutId)
            => await _context.Comments.Where(c => c.WorkoutId == workoutId).ToListAsync();

        [HttpGet("exercise/{exerciseId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetByExercise(int exerciseId)
            => await _context.Comments.Where(c => c.ExerciseId == exerciseId).ToListAsync();
    }
}