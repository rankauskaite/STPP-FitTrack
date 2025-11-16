using FitTrackAPI.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FitTrackAPI.Services
{
    public class JwtTokenService
    {
        private readonly JwtSettings _jwtSettings;

        public JwtTokenService(IOptions<JwtSettings> jwtSettings)
        {
            _jwtSettings = jwtSettings.Value;
        }

        // ---------------- ACCESS TOKEN ----------------
        public string GenerateAccessToken(User user)
        {
            var claims = new List<Claim>
            {
                // Pagrindinis identifikatorius – Username
                new Claim(ClaimTypes.NameIdentifier, user.Username),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Name, user.FullName ?? user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ---------------- REFRESH TOKEN ----------------
        public (string token, DateTime expiry) GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);

            var token = Convert.ToBase64String(randomBytes);
            var expiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);

            return (token, expiry);
        }

        // ---------------- VALIDATION ----------------
        public bool IsRefreshTokenExpired(DateTime? expiryTime)
        {
            return expiryTime == null || expiryTime < DateTime.UtcNow;
        }
    }
}

// jwt.io
// ten įklijuosi savo token tą prisijungimo tada pažiūrės galiojima ar roles turi paklaus kiek galio prisijungimo 
// kiek refresh token tada paprašys kažką padaryti ko negali neprisijungus padaryti poto prisijungti ir tą padaryti
// logout parodyti kad veikia aš tiesiog duomenų bazėj parodžiau nes pas mane refresh token atšaukia bet to prijungimo 
// ne tai tipo kaip ir negerai turėtu abu atšauti bet nėra didelės problemos poto koda žiūrėjo 
// ir dar ko eligijus nori kad jei user1 kažka papildė ar parašė komentarą nu kažka tai jam leistu tik gauti ir matyti 
// jo parašytus dalykus ir leistu modifikuoti tik jo parašytus ir sukurtu įrašus ir neleistu kitų useriu matyti koreguoti 
// ir trinti įrašų (šito pas mane nebuvo nes nežinojau tai 9 gavau)

// 🔥 IŠVADA: AR PAS TAVE VISKAS PADARYTA PAGAL REIKALAVIMUS?
// Reikalavimas	Statusas
// JWT Access token su roles, exp	✅ Padaryta
// Refresh token	✅ Padaryta
// Login/Logout	✅ Priimtina
// Komentarai tik prisijungusiems	❌ NE pilnai
// Ownership (user gali keisti tik savo)	❌ TRŪKSTA
// Training plan private/public	❌ TRŪKSTA
// Admin mato viską	❌ NE pilnai
// User mato tik savo sukurtus	❌ TRŪKSTA