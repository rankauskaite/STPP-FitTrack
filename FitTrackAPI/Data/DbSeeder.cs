using FitTrackAPI.Models;

namespace FitTrackAPI.Data
{
    public static class DbSeeder
    {
        public static void Seed(FitTrackDbContext context)
        {
            if (context.Users.Any()) return;

            // ---------------- USERS ----------------
            var users = new List<User>
            {
                new User { Username = "admin", FullName = "Jolanta Jolantienė", Password = "admin", Role = Role.Admin },
                new User { Username = "trenerisMatas", FullName = "Matas Mataitis", Password = "matas", Role = Role.Trainer },
                new User { Username = "trenerėGreta", FullName = "Greta Gretaitė", Password = "greta", Role = Role.Trainer },
                new User { Username = "narysTadas", FullName = "Tadas Tadaitis", Password = "tadas", Role = Role.Member },
                new User { Username = "narysBenas", FullName = "Benas Benaitis", Password = "benas", Role = Role.Member },
                new User { Username = "narėAsta", FullName = "Asta Astienė", Password = "asta", Role = Role.Member },
                new User { Username = "narysJonas", FullName = "Jonas Jonaitis", Password = "jonas", Role = Role.Member },
                new User { Username = "narysEglė", FullName = "Eglė Eglaitė", Password = "egle", Role = Role.Member }
            };

            context.Users.AddRange(users);
            context.SaveChanges();

            var admin = users[0];
            var treneris1 = users[1];
            var treneris2 = users[2];
            var member1 = users[3];
            var member2 = users[4];
            var member3 = users[5];
            var member4 = users[6];
            var member5 = users[7];

            // ---------------- TRAINING PLANS ----------------
            var plans = new List<TrainingPlan>
            {
                new TrainingPlan { Name = "Krūtinės jėgos planas", DurationWeeks = 4, Type = "Jėga", UserId = member1.Id, IsPublic = true },
                new TrainingPlan { Name = "Pilvo raumenų planas", DurationWeeks = 6, Type = "Jėga", UserId = member1.Id, IsPublic = false },
                new TrainingPlan { Name = "Kardio ištvermės planas", DurationWeeks = 8, Type = "Ištvermė", UserId = member2.Id, IsPublic = true },
                new TrainingPlan { Name = "Viso kūno raumenų planas", DurationWeeks = 5, Type = "Jėga", UserId = member3.Id, IsPublic = true },
                new TrainingPlan { Name = "Namų treniruočių planas", DurationWeeks = 3, Type = "Ištvermė", UserId = member4.Id, IsPublic = true },
                new TrainingPlan { Name = "Riebalų deginimo planas", DurationWeeks = 6, Type = "Kardio", UserId = member5.Id, IsPublic = false }
            };
            context.TrainingPlans.AddRange(plans);
            context.SaveChanges();

            // ---------------- WORKOUTS ----------------
            var workouts = new List<Workout>();
            foreach (var plan in plans)
            {
                for (int i = 1; i <= 2; i++)
                {
                    var workout = new Workout
                    {
                        Date = DateTime.UtcNow.AddDays(-i * 2),
                        Type = $"{plan.Type} treniruotė {i}",
                        DurationMinutes = 40 + i * 5,
                        CaloriesBurned = 300 + i * 40
                    };
                    plan.Workouts.Add(workout);
                    workouts.Add(workout);
                }
            }
            context.SaveChanges();

            // ---------------- EXERCISES ----------------
            var exercises = new List<Exercise>
            {
                new Exercise { Name = "Štangos spaudimas", Sets = 4, Reps = 10, Weight = 60 },
                new Exercise { Name = "Pritūpimai su štanga", Sets = 4, Reps = 12, Weight = 70 },
                new Exercise { Name = "Mirties trauka", Sets = 3, Reps = 8, Weight = 80 },
                new Exercise { Name = "Pečių spaudimas su hanteliais", Sets = 3, Reps = 10, Weight = 20 },
                new Exercise { Name = "Bėgimas ant bėgtakio", Sets = 1, Reps = 1, Weight = 0 },
                new Exercise { Name = "Burpees", Sets = 3, Reps = 15, Weight = 0 }
            };

            context.Exercises.AddRange(exercises);
            context.SaveChanges();

            // Priskiriam pratimų prie treniruočių
            foreach (var workout in workouts)
            {
                workout.Exercises = exercises.Take(3).ToList();
            }
            context.SaveChanges();

            // ---------------- TRAINER - CLIENT RELATIONSHIPS ----------------
            treneris1.Clients = new List<User> { member1, member2, member3 };
            treneris2.Clients = new List<User> { member4, member5 };
            context.SaveChanges();

            // ---------------- SAVED PLANS ----------------
            member1.SavedPlans = new List<TrainingPlan> { plans[2], plans[3] };
            member2.SavedPlans = new List<TrainingPlan> { plans[0] };
            member3.SavedPlans = new List<TrainingPlan> { plans[4], plans[5] };
            context.SaveChanges();

            // ---------------- COMMENTS ----------------
            var comments = new List<Comment>
            {
                new Comment { Text = "Labai gera treniruotė!", CreatedAt = DateTime.UtcNow, UserId = member1.Id, TrainingPlanId = plans[0].Id },
                new Comment { Text = "Reikėtų šiek tiek daugiau poilsio tarp serijų.", CreatedAt = DateTime.UtcNow, UserId = member2.Id, WorkoutId = workouts[0].Id },
                new Comment { Text = "Pratimai sunkoki, bet veiksmingi.", CreatedAt = DateTime.UtcNow, UserId = member3.Id, ExerciseId = exercises[0].Id },
                new Comment { Text = "Puikus planas namų sąlygomis!", CreatedAt = DateTime.UtcNow, UserId = member4.Id, TrainingPlanId = plans[4].Id }
            };
            context.Comments.AddRange(comments);
            context.SaveChanges();

            // ---------------- RATINGS ----------------
            var ratings = new List<Rating>
            {
                new Rating { Score = 5, UserId = member1.Id, TrainingPlanId = plans[0].Id },
                new Rating { Score = 4, UserId = member2.Id, TrainingPlanId = plans[0].Id },
                new Rating { Score = 3, UserId = member3.Id, TrainingPlanId = plans[4].Id },
                new Rating { Score = 5, UserId = member4.Id, TrainingPlanId = plans[2].Id }
            };
            context.Ratings.AddRange(ratings);
            context.SaveChanges();
        }
    }
}
