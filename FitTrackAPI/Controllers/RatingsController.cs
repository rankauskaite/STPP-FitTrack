using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Data;
using FitTrackAPI.Models;

namespace FitTrackAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        public RatingsController(FitTrackDbContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> AddRating(Rating rating)
        {
            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync();
            return Ok(rating);
        }

        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<double>> GetAverage(int planId)
        {
            var avg = await _context.Ratings
                .Where(r => r.TrainingPlanId == planId)
                .AverageAsync(r => (double?)r.Score) ?? 0;
            return Ok(avg);
        }
    }
}