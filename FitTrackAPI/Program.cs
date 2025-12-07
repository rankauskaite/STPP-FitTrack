using FitTrackAPI.Data;
using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Models;
using FitTrackAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------
// 1. CONFIG
// ---------------------------------------------
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

// ---------------------------------------------
// 2. DATABASE
// ---------------------------------------------
builder.Services.AddDbContext<FitTrackDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("localhost"))
// {
//     // Azure – naudok InMemory DB (nemokama)
//     builder.Services.AddDbContext<FitTrackDbContext>(options =>
//         options.UseInMemoryDatabase("FitTrackDB_InMemory"));
// }
// else
// {
//     // Vietinis paleidimas su PostgreSQL
//     builder.Services.AddDbContext<FitTrackDbContext>(options =>
//         options.UseNpgsql(connectionString));
// }


// ---------------------------------------------
// 3. SERVICES
// ---------------------------------------------
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ---------------------------------------------
// 3.5 CORS
// ---------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowUI", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithOrigins("https://fit-track-delta.vercel.app"); // Azure UI adresas
            //.WithOrigins("http://localhost:3000"); // UI adresas
    });
});

// ✅ Swagger su JWT autorizacija
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FitTrackAPI", Version = "v1" });

    // 🔑 JWT schema
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Įveskite 'Bearer' ir tarpą prieš token, pvz.: **Bearer eyJhbGciOiJIUzI1...**"
    });

    // 🔐 Reikalauti autentifikacijos prie visų endpoint’ų (jei jie pažymėti [Authorize])
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ---------------------------------------------
// 4. JWT AUTHENTICATION
// ---------------------------------------------
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
if (jwtSettings == null || string.IsNullOrWhiteSpace(jwtSettings.Key))
{
    throw new InvalidOperationException("JwtSettings are not configured correctly. Ensure 'JwtSettings:Key' is present in configuration.");
}
var key = Encoding.UTF8.GetBytes(jwtSettings.Key);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,

        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(key),

        ClockSkew = TimeSpan.Zero // token galiojimas be 5 min buferio
    };
});

// ---------------------------------------------
// 5. BUILD
// ---------------------------------------------
var app = builder.Build();

// ---------------------------------------------
// 6. DATABASE INIT
// ---------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FitTrackDbContext>();
    // db.Database.EnsureCreated();
    // DbSeeder.Seed(db);
}

// ---------------------------------------------
// 7. PIPELINE
// ---------------------------------------------
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }
app.UseSwagger();
app.UseSwaggerUI();


app.UseHttpsRedirection();

app.UseCors("AllowUI");

app.UseAuthentication();   // SVARBU: turi eiti prieš Authorization
app.UseAuthorization();

app.MapControllers();

app.Run();