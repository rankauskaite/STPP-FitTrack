using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FitTrackAPI.Models
{
    public enum Role { Guest, Member, Trainer, Admin }

    public class User
    {
        [Key]
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Password { get; set; } = string.Empty; // paprastai, be hash
        public Role Role { get; set; }

        // JWT Refresh token support
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        
        [JsonIgnore]
        public ICollection<TrainingPlan> TrainingPlans { get; set; } = new List<TrainingPlan>();
        [JsonIgnore]
        public ICollection<TrainingPlan> SavedPlans { get; set; } = new List<TrainingPlan>();
        public List<User> Clients { get; set; } = new(); // jei treneris
    }
}
