using FitTrackAPI.Models;

namespace FitTrackAPI.Data
{
    public static class DbSeeder
    {
        public static void Seed(FitTrackDbContext context)
        {
            //if (context.Users.Any()) return;
            // 🔥 IŠTRINAME VISKĄ IŠ DB prieš seed'inant
            context.Comments.RemoveRange(context.Comments);
            context.Ratings.RemoveRange(context.Ratings);
            context.Exercises.RemoveRange(context.Exercises);
            context.Workouts.RemoveRange(context.Workouts);
            context.TrainingPlans.RemoveRange(context.TrainingPlans);
            context.Users.RemoveRange(context.Users);
            context.SaveChanges();


            var hasher = new Services.PasswordService();

            // ---------------- USERS ----------------
            var users = new List<User>
            {
                new User { Username = "admin", FullName = "Jolanta Jolantienė", Role = Role.Admin },
                new User { Username = "trenerisMatas", FullName = "Matas Mataitis", Role = Role.Trainer },
                new User { Username = "trenerėGreta", FullName = "Greta Gretaitė", Role = Role.Trainer },
                new User { Username = "narysTadas", FullName = "Tadas Tadaitis", Role = Role.Member },
                new User { Username = "narysBenas", FullName = "Benas Benaitis", Role = Role.Member },
                new User { Username = "narėAsta", FullName = "Asta Astienė", Role = Role.Member },
                new User { Username = "narysJonas", FullName = "Jonas Jonaitis", Role = Role.Member },
                new User { Username = "narysEglė", FullName = "Eglė Eglaitė", Role = Role.Member }
            };

            // Slaptažodžių hash'ai
            users[0].Password = hasher.HashPassword(users[0], "admin");
            users[1].Password = hasher.HashPassword(users[1], "matas");
            users[2].Password = hasher.HashPassword(users[2], "greta");
            users[3].Password = hasher.HashPassword(users[3], "tadas");
            users[4].Password = hasher.HashPassword(users[4], "benas");
            users[5].Password = hasher.HashPassword(users[5], "asta");
            users[6].Password = hasher.HashPassword(users[6], "jonas");
            users[7].Password = hasher.HashPassword(users[7], "egle");

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

            // ---------------- TRAINER - CLIENT RELATIONSHIPS ----------------
            treneris1.Clients = new List<User> { member1, member2, member3 };
            treneris2.Clients = new List<User> { member4, member5 };
            context.SaveChanges();

            // ---------------- TRAINING PLANS ----------------
            var plans = new List<TrainingPlan>
            {
                new TrainingPlan { Name = "Krūtinės jėgos planas", DurationWeeks = 4, Type = "Jėga", Username = treneris1.Username, IsPublic = true, IsApproved = true },
                new TrainingPlan { Name = "Pilvo raumenų planas", DurationWeeks = 6, Type = "Jėga", Username = treneris1.Username, IsPublic = false, IsApproved = false },
                new TrainingPlan { Name = "Kardio ištvermės planas", DurationWeeks = 8, Type = "Ištvermė", Username = treneris2.Username, IsPublic = true, IsApproved = true },
                new TrainingPlan { Name = "Viso kūno planas", DurationWeeks = 5, Type = "Jėga", Username = treneris2.Username, IsPublic = true, IsApproved = true },
                new TrainingPlan { Name = "Namų treniruočių planas", DurationWeeks = 3, Type = "Ištvermė", Username = member1.Username, IsPublic = true },
                new TrainingPlan { Name = "Riebalų deginimo planas", DurationWeeks = 6, Type = "Kardio", Username = member2.Username, IsPublic = false }
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
                        Date = DateTime.UtcNow.AddDays(-i),
                        Type = $"{plan.Type} treniruotė {i}",
                        DurationMinutes = 45 + i * 10,
                        CaloriesBurned = 350 + i * 50,
                        Username = plan.Username
                    };
                    plan.Workouts.Add(workout);
                    workouts.Add(workout);
                }
            }
            context.Workouts.AddRange(workouts);
            context.SaveChanges();

            // ---------------- EXERCISES ----------------
            var exercises = new List<Exercise>
            {
                new Exercise { Name = "Štangos spaudimas", Sets = 4, Reps = 10, Weight = 60, Username = treneris1.Username },
                new Exercise { Name = "Pritūpimai su štanga", Sets = 4, Reps = 12, Weight = 70, Username = treneris1.Username },
                new Exercise { Name = "Mirties trauka", Sets = 3, Reps = 8, Weight = 80, Username = treneris2.Username },
                new Exercise { Name = "Pečių spaudimas su hanteliais", Sets = 3, Reps = 10, Weight = 20, Username = treneris2.Username },
                new Exercise { Name = "Bėgimas ant bėgtakio", Sets = 1, Reps = 1, Weight = 0, Username = member1.Username },
                new Exercise { Name = "Burpees", Sets = 3, Reps = 15, Weight = 0, Username = member2.Username }
            };

            context.Exercises.AddRange(exercises);
            context.SaveChanges();

            // Priskiriam pratimų prie treniruočių
            foreach (var workout in workouts)
            {
                workout.Exercises = exercises.Take(3).ToList();
            }
            context.SaveChanges();

            // ---------------- SAVED PLANS ----------------
            member1.SavedPlans = new List<TrainingPlan> { plans[0], plans[2] };
            member2.SavedPlans = new List<TrainingPlan> { plans[3] };
            member3.SavedPlans = new List<TrainingPlan> { plans[4], plans[5] };
            context.SaveChanges();

            // ---------------- COMMENTS ----------------
            var comments = new List<Comment>
            {
                new Comment { Text = "Labai gera treniruotė!", Username = member1.Username, TrainingPlanId = plans[0].Id },
                new Comment { Text = "Reikėtų daugiau poilsio tarp serijų.", Username = member2.Username, WorkoutId = workouts[0].Id },
                new Comment { Text = "Pratimai sunkoki, bet veiksmingi.", Username = member3.Username, ExerciseId = exercises[0].Id },
                new Comment { Text = "Puikus planas namų sąlygomis!", Username = member4.Username, TrainingPlanId = plans[4].Id }
            };
            context.Comments.AddRange(comments);
            context.SaveChanges();

            // ---------------- RATINGS ----------------
            var ratings = new List<Rating>
            {
                new Rating { Score = 5, Username = member1.Username, TrainingPlanId = plans[0].Id },
                new Rating { Score = 4, Username = member2.Username, TrainingPlanId = plans[0].Id },
                new Rating { Score = 3, Username = member3.Username, TrainingPlanId = plans[4].Id },
                new Rating { Score = 5, Username = member4.Username, TrainingPlanId = plans[2].Id }
            };
            context.Ratings.AddRange(ratings);
            context.SaveChanges();
        }
    }
}