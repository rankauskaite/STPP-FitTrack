using Microsoft.EntityFrameworkCore;
using FitTrackAPI.Models;

namespace FitTrackAPI.Data
{
    public class FitTrackDbContext : DbContext
    {
        public FitTrackDbContext(DbContextOptions<FitTrackDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<TrainingPlan> TrainingPlans { get; set; }
        public DbSet<Workout> Workouts { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Rating> Ratings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 🔑 USER: nustatom Username kaip PK
            modelBuilder.Entity<User>()
                .HasKey(u => u.Username);

            // -----------------------------------
            // 🔗 RELATIONSHIPS
            // -----------------------------------

            // Exercise ↔ Workout (many-to-many)
            modelBuilder.Entity<Exercise>()
                .HasMany(e => e.Workouts)
                .WithMany(w => w.Exercises)
                .UsingEntity(j => j.ToTable("WorkoutExercises"));

            // Workout ↔ TrainingPlan (many-to-many)
            modelBuilder.Entity<Workout>()
                .HasMany(w => w.TrainingPlans)
                .WithMany(tp => tp.Workouts)
                .UsingEntity(j => j.ToTable("TrainingPlanWorkouts"));

            // User ↔ TrainingPlan (1-to-many, per Username)
            modelBuilder.Entity<TrainingPlan>()
                .HasOne(tp => tp.User)
                .WithMany(u => u.TrainingPlans)
                .HasForeignKey(tp => tp.Username)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // User ↔ Exercise (1-to-many, per Username)
            modelBuilder.Entity<Exercise>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.Username)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // User ↔ Workout (1-to-many, per Username)
            modelBuilder.Entity<Workout>()
                .HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.Username)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // User ↔ Comment (1-to-many, per Username)
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.Username)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // User ↔ Rating (1-to-many, per Username)
            modelBuilder.Entity<Rating>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.Username)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // User ↔ SavedPlans (many-to-many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.SavedPlans)
                .WithMany(tp => tp.SavedByUsers)
                .UsingEntity(j => j.ToTable("UserSavedPlans"));

            // 🧍‍♂️ User ↔ Clients (trainer-client many-to-many, su aiškiais FK)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Clients)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "TrainerClients",
                    j => j
                        .HasOne<User>()
                        .WithMany()
                        .HasForeignKey("ClientUsername")
                        .HasPrincipalKey(u => u.Username)
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j
                        .HasOne<User>()
                        .WithMany()
                        .HasForeignKey("TrainerUsername")
                        .HasPrincipalKey(u => u.Username)
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("TrainerUsername", "ClientUsername");
                    });
        }
    }
}