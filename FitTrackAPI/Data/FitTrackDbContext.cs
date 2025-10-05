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

            // Exercise ↔ Workout
            modelBuilder.Entity<Exercise>()
                .HasMany(e => e.Workouts)
                .WithMany(w => w.Exercises)
                .UsingEntity(j => j.ToTable("WorkoutExercises"));

            // Workout ↔ TrainingPlan
            modelBuilder.Entity<Workout>()
                .HasMany(w => w.TrainingPlans)
                .WithMany(tp => tp.Workouts)
                .UsingEntity(j => j.ToTable("TrainingPlanWorkouts"));

            // User ↔ TrainingPlan (vienas prie daugelio)
            modelBuilder.Entity<TrainingPlan>()
                .HasOne(tp => tp.User)
                .WithMany(u => u.TrainingPlans)
                .HasForeignKey(tp => tp.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User ↔ SavedPlans (Many-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.SavedPlans)
                .WithMany(tp => tp.SavedByUsers)
                .UsingEntity(j => j.ToTable("UserSavedPlans"));

            // User ↔ Clients (Treneris ↔ Klientai)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Clients)
                .WithMany()
                .UsingEntity(j => j.ToTable("TrainerClients"));
        }
    }
}
