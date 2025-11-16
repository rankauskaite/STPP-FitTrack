using FitTrackAPI.Data;
using FitTrackAPI.Models;
using FitTrackAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrackAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FitTrackDbContext _context;
        private readonly JwtTokenService _tokenService;
        private readonly PasswordService _passwords;

        public AuthController(
            FitTrackDbContext context, 
            JwtTokenService tokenService,
            PasswordService passwords)
        {
            _context = context;
            _tokenService = tokenService;
            _passwords = passwords;
        }

        // ---------------- LOGIN ----------------
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null)
                return Unauthorized(new { message = "Neteisingas prisijungimas." });

            if (!_passwords.VerifyPassword(user, request.Password))
                return Unauthorized(new { message = "Neteisingas slaptažodis." });

            var accessToken = _tokenService.GenerateAccessToken(user);
            var (refreshToken, refreshExpiry) = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = refreshExpiry;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                accessToken,
                refreshToken,
                role = user.Role.ToString(),
                username = user.Username
            });
        }

        // ---------------- REFRESH ----------------
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(RefreshRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null)
                return Unauthorized(new { message = "Refresh token nerastas." });

            if (_tokenService.IsRefreshTokenExpired(user.RefreshTokenExpiryTime))
                return Unauthorized(new { message = "Refresh token negalioja." });

            var newAccess = _tokenService.GenerateAccessToken(user);
            var (newRefresh, newExpiry) = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefresh;
            user.RefreshTokenExpiryTime = newExpiry;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                accessToken = newAccess,
                refreshToken = newRefresh
            });
        }

        // ---------------- LOGOUT ----------------
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(RefreshRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null)
                return NotFound();

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Atsijungta." });
        }
    }
}