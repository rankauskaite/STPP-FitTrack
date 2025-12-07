using FitTrackAPI.Data;
using FitTrackAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrackAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExerciseTemplatesController : ControllerBase
    {
        private readonly FitTrackDbContext _context;

        public ExerciseTemplatesController(FitTrackDbContext context)
        {
            _context = context;
        }

        // Šituo gausi visus default pratimus: pavadinimas + nuotrauka
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExerciseTemplate>>> GetAll()
        {
            return await _context.ExerciseTemplates.ToListAsync();
        }
    }
}