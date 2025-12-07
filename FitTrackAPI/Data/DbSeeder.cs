using FitTrackAPI.Models;
using FitTrackAPI.Services;

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
            context.ExerciseTemplates.RemoveRange(context.ExerciseTemplates);
            context.Users.RemoveRange(context.Users);
            context.SaveChanges();

            var hasher = new PasswordService();

            // ---------------- USERS ----------------
            var users = new List<User>
            {
                new User { Username = "admin",        FullName = "Jolanta Jolantienė", Role = Role.Admin },
                new User { Username = "trenerisMatas",FullName = "Matas Mataitis",     Role = Role.Trainer },
                new User { Username = "trenereGreta", FullName = "Greta Gretaitė",     Role = Role.Trainer },
                new User { Username = "narysTadas",   FullName = "Tadas Tadaitis",     Role = Role.Member },
                new User { Username = "narysBenas",   FullName = "Benas Benaitis",     Role = Role.Member },
                new User { Username = "nareAsta",     FullName = "Asta Astienė",       Role = Role.Member },
                new User { Username = "narysJonas",   FullName = "Jonas Jonaitis",     Role = Role.Member },
                new User { Username = "narysEglė",    FullName = "Eglė Eglaitė",       Role = Role.Member }
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

            var admin     = users[0];
            var treneris1 = users[1];
            var treneris2 = users[2];
            var member1   = users[3];
            var member2   = users[4];
            var member3   = users[5];
            var member4   = users[6];
            var member5   = users[7];

            // ---------------- TRAINER - CLIENT RELATIONSHIPS ----------------
            treneris1.Clients = new List<User> { member1, member2, member3 };
            treneris2.Clients = new List<User> { member4, member5 };
            context.SaveChanges();

            // ---------------- TRAINING PLANS (dabar 10) ----------------
            var plans = new List<TrainingPlan>
            {
                new TrainingPlan 
                { 
                    Name = "Krūtinės jėgos planas", 
                    DurationWeeks = 4, 
                    Type = "Jėga", 
                    Username = treneris1.Username, 
                    IsPublic = true, 
                    IsApproved = true, 
                    ImageUrl = "/trainingPlans/trainingPlan1.jpg" 
                },
                new TrainingPlan 
                { 
                    Name = "Pilvo raumenų planas", 
                    DurationWeeks = 6, 
                    Type = "Jėga", 
                    Username = treneris1.Username, 
                    IsPublic = false, 
                    IsApproved = false, 
                    ImageUrl = "/trainingPlans/trainingPlan2.jpg" 
                },
                new TrainingPlan 
                { 
                    Name = "Kardio ištvermės planas", 
                    DurationWeeks = 8, 
                    Type = "Ištvermė", 
                    Username = treneris2.Username, 
                    IsPublic = true, 
                    IsApproved = true, 
                    ImageUrl = "/trainingPlans/trainingPlan3.jpg" 
                },
                new TrainingPlan 
                { 
                    Name = "Viso kūno jėgos planas", 
                    DurationWeeks = 5, 
                    Type = "Jėga", 
                    Username = treneris2.Username, 
                    IsPublic = true, 
                    IsApproved = true, 
                    ImageUrl = "/trainingPlans/trainingPlan4.jpg" 
                },
                new TrainingPlan 
                { 
                    Name = "Namų treniruočių planas", 
                    DurationWeeks = 3, 
                    Type = "Ištvermė", 
                    Username = member1.Username, 
                    IsPublic = true, 
                    ImageUrl = "/trainingPlans/trainingPlan5.jpg" 
                },
                new TrainingPlan 
                { 
                    Name = "Riebalų deginimo planas", 
                    DurationWeeks = 6, 
                    Type = "Kardio", 
                    Username = member2.Username, 
                    IsPublic = false, 
                    ImageUrl = "/trainingPlans/trainingPlan6.jpg" 
                },

                // Nauji planai
                new TrainingPlan
                {
                    Name = "Nugaros ir bicepsų planas",
                    DurationWeeks = 5,
                    Type = "Jėga",
                    Username = treneris1.Username,
                    IsPublic = true,
                    IsApproved = true,
                    ImageUrl = "/trainingPlans/trainingPlan7.jpg"
                },
                new TrainingPlan
                {
                    Name = "Kojų jėgos ir sprogstamumo planas",
                    DurationWeeks = 4,
                    Type = "Jėga",
                    Username = treneris2.Username,
                    IsPublic = true,
                    IsApproved = true,
                    ImageUrl = "/trainingPlans/trainingPlan8.jpg"
                },
                new TrainingPlan
                {
                    Name = "Pradedančiųjų salės planas",
                    DurationWeeks = 4,
                    Type = "Jėga",
                    Username = member3.Username,
                    IsPublic = true,
                    IsApproved = false,
                    ImageUrl = "/trainingPlans/trainingPlan3.jpg"
                },
                new TrainingPlan
                {
                    Name = "Lankstumo ir mobilumo planas",
                    DurationWeeks = 6,
                    Type = "Mobilumas",
                    Username = member4.Username,
                    IsPublic = true,
                    IsApproved = true,
                    ImageUrl = "/trainingPlans/trainingPlan6.jpg"
                }
            };
            context.TrainingPlans.AddRange(plans);
            context.SaveChanges();

            // ---------------- WORKOUTS (po 3 kiekvienam planui) ----------------
            var workouts = new List<Workout>();

            foreach (var plan in plans)
            {
                for (int i = 1; i <= 3; i++)
                {
                    var type = plan.Type switch
                    {
                        "Jėga"     => WorkoutType.Jegos,
                        "Kardio"   => WorkoutType.Kardio,
                        "Ištvermė" => WorkoutType.Istvermes,
                        _          => WorkoutType.Kita
                    };

                    var workout = new Workout
                    {
                        Name = $"{plan.Name} — treniruotė {i}",
                        Date = DateTime.UtcNow.AddDays(-i),
                        Type = type,
                        DurationMinutes = 40 + i * 10,
                        CaloriesBurned = 300 + i * 60,
                        Username = plan.Username,
                        ImageUrl = WorkoutImageService.GetImageForType(type)
                    };

                    plan.Workouts.Add(workout);
                    workouts.Add(workout);
                }
            }

            context.Workouts.AddRange(workouts);
            context.SaveChanges();

            // ---------------- EXERCISE TEMPLATES ----------------
            var templates = new List<ExerciseTemplate>
            {
                // ================= KRŪTINĖ =================
                new ExerciseTemplate
                {
                    Name = "Štangos spaudimas gulint",
                    ImageUrl = "/exercises/bench-press.gif",
                    MusclesImageUrl = "/exercises/bench-press-muscles.png",
                    HowToImageUrl = "/exercises/bench-press-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_BENCH_PRESS",

                    Category = ExerciseCategory.Krutine,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Štanga, suoliukas",
                    PrimaryMuscles = "Krūtinės raumenys",
                    SecondaryMuscles = "Tricepsai, priekinė deltų dalis",
                    ShortDescription = "Klasikinis jėgos pratimas krūtinei, stiprinantis viršutinę kūno dalį.",

                    ExecutionSteps =
                        "1) Atsigulk ant suoliuko, pėdos tvirtai ant žemės.\n" +
                        "2) Suimk štangą kiek plačiau nei pečių plotis.\n" +
                        "3) Iškelk štangą ir lėtai leisk link krūtinės kontroliuodamas judesį.\n" +
                        "4) Stipriai stumk štangą aukštyn, neišlenkdamas nugaros.",
                    Tips =
                        "Laikyk mentis prispaustas ir krūtinę pakeltą.\n" +
                        "Judink štangą vertikalia trajektorija, nekaitaliok alkūnių padėties.",
                    CommonMistakes =
                        "Per didelis svoris ir „atšokimas“ nuo krūtinės.\n" +
                        "Per didelis nugaros išlenkimas.\n" +
                        "Alkūnės per plačiai ir įtempti riešai."
                },

                new ExerciseTemplate
                {
                    Name = "Spaudimas hanteliais gulint",
                    ImageUrl = "/exercises/dumbbell-bench-press.gif",
                    MusclesImageUrl = "/exercises/dumbbell-bench-press-muscles.png",
                    HowToImageUrl = "/exercises/dumbbell-bench-press-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_DB_BENCH",

                    Category = ExerciseCategory.Krutine,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Du hanteliai, suoliukas",
                    PrimaryMuscles = "Krūtinės raumenys",
                    SecondaryMuscles = "Tricepsai, priekinė deltų dalis, stabilizatoriai",
                    ShortDescription = "Krūtinės spaudimas su hanteliais suteikia didesnę judesio amplitudę ir aktyvuoja stabilizatorius.",

                    ExecutionSteps =
                        "1) Atsigulk ant suoliuko, hanteliai ties krūtine, delnai žiūri į priekį.\n" +
                        "2) Išstumk hantelius aukštyn, viršuje šiek tiek suartink.\n" +
                        "3) Lėtai leisk žemyn iki alkūnių ~90° kampo.\n" +
                        "4) Kartok, išlaikydamas vienodą tempo kontrolę.",
                    Tips =
                        "Neleisk hanteliams „kristi“ žemyn – kontroliuok ekscentrinę fazę.\n" +
                        "Laikyk pečius nuleistus ir mentis prispaustas.",
                    CommonMistakes =
                        "Per plati amplitudė ir skausmas pečiuose.\n" +
                        "Asimetriškas hantelių kėlimas.\n" +
                        "Per greitas, nekontroliuojamas judesys."
                },

                new ExerciseTemplate
                {
                    Name = "Atsispaudimai",
                    ImageUrl = "/exercises/push-ups.gif",
                    MusclesImageUrl = "/exercises/push-ups-muscles.png",
                    HowToImageUrl = "/exercises/push-ups-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_PUSH_UPS",

                    Category = ExerciseCategory.Krutine,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Kūno svoris",
                    PrimaryMuscles = "Krūtinės raumenys, tricepsai",
                    SecondaryMuscles = "Priekinė deltų dalis, pilvo presas, sėdmenys",
                    ShortDescription = "Paprastas, bet efektyvus kūno svorio pratimas viršutinei kūno daliai ir korpusui.",

                    ExecutionSteps =
                        "1) Užimk lentos poziciją: delnai po pečiais arba šiek tiek plačiau, kūnas tiesus.\n" +
                        "2) Įtrauk pilvo raumenis ir sulaikyk neutralų juosmenį.\n" +
                        "3) Lėtai leiskis žemyn, kol krūtinė priartėja prie grindų.\n" +
                        "4) Stumkis atgal į pradinę padėtį, neišlankstant nugaros.",
                    Tips =
                        "Žiūrėk šiek tiek į priekį, kad kaklas liktų neutralus.\n" +
                        "Jei sunku – pradėk nuo atsispaudimų nuo kelių ar pakylos.",
                    CommonMistakes =
                        "Nusileidimas tik puse amplitudės.\n" +
                        "„Sulūžusi“ linija per klubus (pernelyg užriečiant sėdmenis ar leidžiant juos žemyn).\n" +
                        "Per plačiai išskėstos alkūnės."
                },

                // ================= NUGARA =================
                new ExerciseTemplate
                {
                    Name = "Mirties trauka",
                    ImageUrl = "/exercises/deadlift.gif",
                    MusclesImageUrl = "/exercises/deadlift-muscles.png",
                    HowToImageUrl = "/exercises/deadlift-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_DEADLIFT",

                    Category = ExerciseCategory.Nugara,
                    Difficulty = ExerciseDifficulty.Advanced,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Štanga",
                    PrimaryMuscles = "Sėdmenys, užpakalinė šlaunų dalis, nugaros tiesiamieji",
                    SecondaryMuscles = "Trapecija, dilbiai, pilvo presas",
                    ShortDescription = "Vienas pagrindinių kompleksinių pratimų visai užpakalinei kūno daliai.",

                    ExecutionSteps =
                        "1) Atsistok prie štangos, pėdos klubų plotyje, štanga virš pėdų vidurio.\n" +
                        "2) Sulenk kelius, pasilenk iš klubų ir suimk štangą.\n" +
                        "3) Laikydamas nugarą tiesią, kelk štangą aukštyn, stumdamas žemę per kulnus.\n" +
                        "4) Viršuje pilnai neišlenk nugaros atgal, kontroliuok judesį leidžiantis.",
                    Tips =
                        "Laikyk štangą arti kūno viso judesio metu.\n" +
                        "Prieš kėlimą įkvėpk, įtempk korpusą ir išlaikyk pilvo spaudimą.",
                    CommonMistakes =
                        "Apvali nugara kėlimo metu.\n" +
                        "Štanga tolsta nuo blauzdų.\n" +
                        "Per anksti tiesiamos kojos ir visa apkrova tenka juosmeniui."
                },

                new ExerciseTemplate
                {
                    Name = "Prisitraukimai",
                    ImageUrl = "/exercises/pull-ups.gif",
                    MusclesImageUrl = "/exercises/pull-ups-muscles.png",
                    HowToImageUrl = "/exercises/pull-ups-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_PULL_UPS",

                    Category = ExerciseCategory.Nugara,
                    Difficulty = ExerciseDifficulty.Advanced,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Skersinis",
                    PrimaryMuscles = "Platieji nugaros raumenys",
                    SecondaryMuscles = "Bicepsai, užpakalinė deltų dalis, dilbiai",
                    ShortDescription = "Sunkus kūno svorio pratimas viršutinei nugarai ir rankoms.",

                    ExecutionSteps =
                        "1) Suimk skersinį šiek tiek plačiau nei pečių plotis.\n" +
                        "2) Pakabok aktyviai: pečius trauk atgal ir žemyn.\n" +
                        "3) Trauk kūną aukštyn, kol smakras virš skersinio.\n" +
                        "4) Lėtai leiskis žemyn iki pilnos rankų tiesos.",
                    Tips =
                        "Stenkitės „traukti alkūnes žemyn“, o ne tempti smakrą aukštyn.\n" +
                        "Pradžioje galima naudoti gumas ar gravitacijos treniruoklį.",
                    CommonMistakes =
                        "Trumpa amplitudė – nenusileidžiama iki apačios.\n" +
                        "Sūpavimasis ir pagava iš kojų.\n" +
                        "Per stipriai kilstelėti pečiai prie ausų."
                },

                new ExerciseTemplate
                {
                    Name = "Prisitraukimai prie krūtinės treniruoklyje",
                    ImageUrl = "/exercises/lat-pulldown.gif",
                    MusclesImageUrl = "/exercises/lat-pulldown-muscles.png",
                    HowToImageUrl = "/exercises/lat-pulldown-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LAT_PULLDOWN",

                    Category = ExerciseCategory.Nugara,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Viršutinės traukos treniruoklis",
                    PrimaryMuscles = "Platieji nugaros raumenys",
                    SecondaryMuscles = "Bicepsai, užpakalinė deltų dalis",
                    ShortDescription = "Traukos pratimas, imituojantis prisitraukimus, bet su reguliuojama apkrova.",

                    ExecutionSteps =
                        "1) Atsisėsk treniruoklyje, keliai prispausti po atrama.\n" +
                        "2) Suimk rankeną plačiai, krūtinę laikyk pakeltą.\n" +
                        "3) Trauk rankeną link viršutinės krūtinės dalies, pečius traukdamas žemyn.\n" +
                        "4) Lėtai grąžink rankeną į viršų, nepaleisdamas įtampą.",
                    Tips =
                        "Nelenk nugaros pernelyg atgal – tik lengvas pasilenkimas.\n" +
                        "Kontroliuok grąžinimą – nepalik svorių „kristi“.",
                    CommonMistakes =
                        "Per didelė inercija ir siūbavimas.\n" +
                        "Traukimas tik rankomis, neįjungiant nugaros.\n" +
                        "Rankenos leidimas žemiau krūtinės, suapvalinant pečius."
                },

                new ExerciseTemplate
                {
                    Name = "Irklavimas štanga pasilenkus",
                    ImageUrl = "/exercises/barbell-row.gif",
                    MusclesImageUrl = "/exercises/barbell-row-muscles.png",
                    HowToImageUrl = "/exercises/barbell-row-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_BARBBELL_ROW",

                    Category = ExerciseCategory.Nugara,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Štanga",
                    PrimaryMuscles = "Vidurinė ir viršutinė nugara",
                    SecondaryMuscles = "Bicepsai, užpakalinė deltų dalis, juosmuo",
                    ShortDescription = "Traukos pratimas stiprinantis vidurinę nugaros dalį ir viršutinę kūno dalį.",

                    ExecutionSteps =
                        "1) Pasilenk iš klubų, nugara tiesi, keliai šiek tiek sulenkti.\n" +
                        "2) Štanga laikoma žemiau kelių, rankos šiek tiek plačiau nei pečiai.\n" +
                        "3) Trauk štangą link apatinės pilvo dalies, alkūnes vesdamas atgal.\n" +
                        "4) Lėtai grąžink štangą žemyn, išlaikydamas kūno kampą.",
                    Tips =
                        "Laikyk kaklą neutralų, žvilgsnį – į žemę prieš save.\n" +
                        "Nesiriesk – korpusą išlaikyk stabilų ir įtemptą.",
                    CommonMistakes =
                        "Per didelis svoris ir „šokinėjantis“ judesys.\n" +
                        "Apvali nugara.\n" +
                        "Štanga traukiama į krūtinę, o ne į liemenį."
                },

                // ================= KOJOS =================
                new ExerciseTemplate
                {
                    Name = "Pritūpimai su štanga",
                    ImageUrl = "/exercises/squat.gif",
                    MusclesImageUrl = "/exercises/squat-muscles.png",
                    HowToImageUrl = "/exercises/squat-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_SQUAT",

                    Category = ExerciseCategory.Kojos,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Štanga, stovai",
                    PrimaryMuscles = "Keturgalviai šlaunies raumenys, sėdmenys",
                    SecondaryMuscles = "Užpakalinė šlaunų dalis, nugaros tiesiamieji, pilvo presas",
                    ShortDescription = "Pagrindinis kojų pratimas, stiprinantis visą apatinę kūno dalį.",

                    ExecutionSteps =
                        "1) Uždėk štangą ant viršutinės trapecijos, suimk ją tvirtai.\n" +
                        "2) Atsistok pečių plotyje, pėdos šiek tiek pasuktos į išorę.\n" +
                        "3) Leiskis žemyn lyg sėstum ant kėdės, keliai seka pėdų kryptį.\n" +
                        "4) Stumkis per kulnus atgal į pradinę padėtį.",
                    Tips =
                        "Laikyk krūtinę pakeltą, žvilgsnį – tiesiai.\n" +
                        "Dirbk amplitudėje, kuri leidžia išlaikyti taisyklingą nugarą.",
                    CommonMistakes =
                        "Keliai griūva į vidų.\n" +
                        "Nugaros apvalinimas apatinėje padėtyje.\n" +
                        "Svorio perkėlimas ant pirštų."
                },

                new ExerciseTemplate
                {
                    Name = "Kojų spaudimas treniruoklyje",
                    ImageUrl = "/exercises/leg-press.gif",
                    MusclesImageUrl = "/exercises/leg-press-muscles.png",
                    HowToImageUrl = "/exercises/leg-press-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LEG_PRESS",

                    Category = ExerciseCategory.Kojos,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Kojų spaudimo treniruoklis",
                    PrimaryMuscles = "Keturgalviai šlaunies raumenys",
                    SecondaryMuscles = "Sėdmenys, užpakalinė šlaunų dalis, blauzdos",
                    ShortDescription = "Saugus ir stabilus kojų pratimas su treniruokliu, tinkamas ir pradedantiesiems.",

                    ExecutionSteps =
                        "1) Atsisėsk treniruoklyje, pėdas padėk ant platformos klubų–pečių plotyje.\n" +
                        "2) Atrakink saugiklius ir lėtai leisk platformą žemyn.\n" +
                        "3) Sustok, kai keliai ~90° kampu, neiškelk sėdmenų.\n" +
                        "4) Stumk platformą aukštyn, bet pilnai neištiesk kelių.",
                    Tips =
                        "Laikyk juosmenį prispaustą prie atramos.\n" +
                        "Kelius veski pėdų kryptimi, jų „nelaužyk“ į vidų.",
                    CommonMistakes =
                        "Per gili padėtis, keičianti juosmens padėtį.\n" +
                        "Kelių užrakinimas viršuje.\n" +
                        "Per didelis svoris ir šuoliuojantis judesys."
                },

                new ExerciseTemplate
                {
                    Name = "Ėjimas išsiskėtus su hanteliais (lunges)",
                    ImageUrl = "/exercises/lunges.gif",
                    MusclesImageUrl = "/exercises/lunges-muscles.png",
                    HowToImageUrl = "/exercises/lunges-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LUNGES",

                    Category = ExerciseCategory.Kojos,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Hanteliai",
                    PrimaryMuscles = "Keturgalviai šlaunies raumenys, sėdmenys",
                    SecondaryMuscles = "Užpakalinė šlaunų dalis, blauzdos, stabilizatoriai",
                    ShortDescription = "Vienos kojos pratimas, gerinantis jėgą, balansą ir stabilumą.",

                    ExecutionSteps =
                        "1) Atsistok tiesiai, hanteliai laikomi ties šonais.\n" +
                        "2) Ženk ilgą žingsnį į priekį, abi kojos sulenkiamos.\n" +
                        "3) Leiskis kol abiejų kelių kampas artėja prie 90°.\n" +
                        "4) Stumkis priekine koja atgal į pradinę padėtį ir keisk pusę.",
                    Tips =
                        "Laikyk krūtinę pakeltą, žiūrėk tiesiai.\n" +
                        "Kelį veski ties pėdos centru – neleidžiant jam krypti į vidų.",
                    CommonMistakes =
                        "Per trumpas žingsnis ir per didelis kelio apkrovimas.\n" +
                        "Kūno „griuvimas“ į priekį.\n" +
                        "Svyruojantys keliai ir prastas balansas."
                },

                new ExerciseTemplate
                {
                    Name = "Kojų lenkimas treniruoklyje",
                    ImageUrl = "/exercises/leg-curl.gif",
                    MusclesImageUrl = "/exercises/leg-curl-muscles.png",
                    HowToImageUrl = "/exercises/leg-curl-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LEG_CURL",

                    Category = ExerciseCategory.Kojos,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Kojų lenkimo treniruoklis",
                    PrimaryMuscles = "Užpakalinė šlaunų dalis (dvigalvis šlaunies raumuo)",
                    SecondaryMuscles = "Blauzdos",
                    ShortDescription = "Izoliuotas užpakalinės šlaunų dalies stiprinimo pratimas.",

                    ExecutionSteps =
                        "1) Atsigulk arba atsisėsk treniruoklyje (pagal tipą), kulnai po voleliu.\n" +
                        "2) Įtempk šlaunų galą ir lenk kelius, traukdamas volelius link sėdmenų.\n" +
                        "3) Viršuje trumpai išlaikyk susitraukimą.\n" +
                        "4) Lėtai grąžink kojas į pradinę padėtį.",
                    Tips =
                        "Kontroliuok judesį – nesimušk su svoriais.\n" +
                        "Stenkis nekelti klubų nuo atramos.",
                    CommonMistakes =
                        "Per didelis svoris ir šuoliuojantis judesys.\n" +
                        "Labai trumpa amplitudė.\n" +
                        "Juosmens lenkimas."
                },

                new ExerciseTemplate
                {
                    Name = "Kojų tiesimas treniruoklyje",
                    ImageUrl = "/exercises/leg-extension.gif",
                    MusclesImageUrl = "/exercises/leg-extension-muscles.png",
                    HowToImageUrl = "/exercises/leg-extension-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LEG_EXTENSION",

                    Category = ExerciseCategory.Kojos,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Kojų tiesimo treniruoklis",
                    PrimaryMuscles = "Keturgalviai šlaunies raumenys",
                    SecondaryMuscles = null,
                    ShortDescription = "Izoliuotas keturgalvių stiprinimas, dažnai naudojamas kaip papildomas pratimas.",

                    ExecutionSteps =
                        "1) Atsisėsk treniruoklyje, keliai lygiagretūs sukimosi ašiai.\n" +
                        "2) Tiesk kojas aukštyn iki beveik pilnos tiesos.\n" +
                        "3) Viršuje trumpai išlaikyk įtampą.\n" +
                        "4) Lėtai nuleisk kojas žemyn.",
                    Tips =
                        "Nenaudok per didelio svorio, kad neapkrautum kelių.\n" +
                        "Laikyk judesį tolygų ir kontroliuojamą.",
                    CommonMistakes =
                        "Keliai „laužomi“ atgal pilnai užrakinant.\n" +
                        "Per dideli svoriai ir trūkčiojantis judesys."
                },

                // ================= PEČIAI =================
                new ExerciseTemplate
                {
                    Name = "Pečių spaudimas su hanteliais sėdint",
                    ImageUrl = "/exercises/dumbbell-shoulder-press.gif",
                    MusclesImageUrl = "/exercises/dumbbell-shoulder-press-muscles.png",
                    HowToImageUrl = "/exercises/dumbbell-shoulder-press-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_DB_SHOULDER_PRESS",

                    Category = ExerciseCategory.Peciai,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Hanteliai, sėdimas suoliukas su atkalte",
                    PrimaryMuscles = "Priekinė ir vidurinė deltų dalis",
                    SecondaryMuscles = "Tricepsai, viršutinė krūtinės dalis",
                    ShortDescription = "Pečių jėgos pratimas, stiprinantis visą deltinį raumenį.",

                    ExecutionSteps =
                        "1) Atsisėsk ant suoliuko, hanteliai prie pečių lygio.\n" +
                        "2) Išstumk hantelius aukštyn virš galvos.\n" +
                        "3) Lėtai nuleisk atgal į pradinę padėtį, išlaikydamas alkūnes po svoriais.\n" +
                        "4) Kartok be siūbavimo ar per didelio nugaros išlenkimo.",
                    Tips =
                        "Laikyk liemenį prispaustą prie atlošo.\n" +
                        "Alkūnių nepaleisk labai į šalį, saugok pečius.",
                    CommonMistakes =
                        "Per didelis svoris ir siūbavimas.\n" +
                        "Per žemas nuleidimas, sukeliantis skausmą pečiuose."
                },

                new ExerciseTemplate
                {
                    Name = "Šoninis pakėlimas į šalis su hanteliais",
                    ImageUrl = "/exercises/lateral-raise.gif",
                    MusclesImageUrl = "/exercises/lateral-raise-muscles.png",
                    HowToImageUrl = "/exercises/lateral-raise-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LATERAL_RAISE",

                    Category = ExerciseCategory.Peciai,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Hanteliai",
                    PrimaryMuscles = "Vidurinė deltų dalis",
                    SecondaryMuscles = "Viršutinė trapecija",
                    ShortDescription = "Izoliuotas šoninių deltų pratimas, suteikiantis pečiams platumo.",

                    ExecutionSteps =
                        "1) Atsistok tiesiai, hanteliai prie šonų.\n" +
                        "2) Lengvai sulenk alkūnes ir kelk rankas į šalis iki pečių lygio.\n" +
                        "3) Trumpai išlaikyk viršutinę padėtį.\n" +
                        "4) Lėtai nuleisk hantelius žemyn.",
                    Tips =
                        "Nekelk labai sunkių hantelių – čia svarbi kontrolė.\n" +
                        "Pečius laikyk nuleistus, nekilnok trapecijų per daug.",
                    CommonMistakes =
                        "Rankų „mėtymasas“ iš inercijos.\n" +
                        "Hanteliai keliami virš pečių lygio.\n" +
                        "Per daug dirba trapecija, pečiai praranda vaidmenį."
                },

                new ExerciseTemplate
                {
                    Name = "Vertikalus štangos traukimas prie smakro",
                    ImageUrl = "/exercises/upright-row.webp",
                    MusclesImageUrl = "/exercises/upright-row-muscles.png",
                    HowToImageUrl = "/exercises/upright-row-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_UPRIGHT_ROW",

                    Category = ExerciseCategory.Peciai,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Štanga arba EZ štanga",
                    PrimaryMuscles = "Vidurinė deltų dalis, trapecija",
                    SecondaryMuscles = "Bicepsai, dilbiai",
                    ShortDescription = "Vertikali trauka, apkraunanti pečius ir viršutinę nugaros dalį.",

                    ExecutionSteps =
                        "1) Atsistok tiesiai, štangą laikyk siauresniu–vidutiniu suėmimu.\n" +
                        "2) Trauk štangą aukštyn palei kūną, vedant alkūnes aukščiau riešų.\n" +
                        "3) Sustok ties krūtinės viršumi arba smakru.\n" +
                        "4) Lėtai nuleisk štangą žemyn.",
                    Tips =
                        "Nekelk per aukštai, jei jauti diskomfortą pečiuose.\n" +
                        "Laikyk riešus neutralioje padėtyje.",
                    CommonMistakes =
                        "Per platus ar per siauras suėmimas.\n" +
                        "Per staigus judesys ir trūkčiojimas."
                },

                // ================= BICEPSAS =================
                new ExerciseTemplate
                {
                    Name = "Bicepso lenkimas su štanga",
                    ImageUrl = "/exercises/barbell-curl.gif",
                    MusclesImageUrl = "/exercises/barbell-curl-muscles.png",
                    HowToImageUrl = "/exercises/barbell-curl-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_BARBELL_CURL",

                    Category = ExerciseCategory.Bicepsas,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Tiesi arba EZ štanga",
                    PrimaryMuscles = "Bicepsas",
                    SecondaryMuscles = "Dilbiai",
                    ShortDescription = "Klasikinis bicepso pratimas rankų masei ir jėgai.",

                    ExecutionSteps =
                        "1) Atsistok tiesiai, štangą laikyk žemyn nuleista, delnai į viršų.\n" +
                        "2) Lenk alkūnes, kelk štangą link pečių.\n" +
                        "3) Viršuje trumpai išlaikyk įtampą.\n" +
                        "4) Lėtai nuleisk štangą žemyn.",
                    Tips =
                        "Laikyk alkūnes arti šonų.\n" +
                        "Stenkis nesiūbuoti korpusu ir nepadėti nugaros.",
                    CommonMistakes =
                        "Per didelis svoris ir judesys iš nugaros.\n" +
                        "Alkūnės keliauja į priekį, trumpėja amplitudė."
                },

                new ExerciseTemplate
                {
                    Name = "Bicepso lenkimas su hanteliais",
                    ImageUrl = "/exercises/dumbbell-curl.gif",
                    MusclesImageUrl = "/exercises/dumbbell-curl-muscles.png",
                    HowToImageUrl = "/exercises/dumbbell-curl-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_DB_CURL",

                    Category = ExerciseCategory.Bicepsas,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Hanteliai",
                    PrimaryMuscles = "Bicepsas",
                    SecondaryMuscles = "Dilbiai",
                    ShortDescription = "Bicepso lenkimas su hanteliais leidžia dirbti abiem rankoms atskirai.",

                    ExecutionSteps =
                        "1) Atsistok tiesiai, hanteliai prie šonų.\n" +
                        "2) Lenk alkūnes ir kelk hantelius link pečių.\n" +
                        "3) Viršuje trumpai sulaikyk įtampą.\n" +
                        "4) Lėtai nuleisk žemyn.",
                    Tips =
                        "Galima atlikti paeiliui arba vienu metu.\n" +
                        "Laikyk riešus stabiliai, neperlink.",
                    CommonMistakes =
                        "Per didelis svoris ir siūbavimas.\n" +
                        "Nepilna amplitude – darbas tik viršutinėje dalyje."
                },

                // ================= TRICEPSAS =================
                new ExerciseTemplate
                {
                    Name = "Tricepso stūmimas virš galvos su hanteliu",
                    ImageUrl = "/exercises/overhead-triceps-extension.gif",
                    MusclesImageUrl = "/exercises/overhead-triceps-extension-muscles.png",
                    HowToImageUrl = "/exercises/overhead-triceps-extension-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_OH_TRICEPS",

                    Category = ExerciseCategory.Tricepsas,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Vienas hantelis arba virvė treniruoklyje",
                    PrimaryMuscles = "Tricepsas (ilgoji galva)",
                    SecondaryMuscles = "Pečių stabilizatoriai",
                    ShortDescription = "Virš galvos atliekamas tricepso pratimas, stipriai apkraunantis ilgąją galvą.",

                    ExecutionSteps =
                        "1) Atsisėsk arba atsistok, hantelį laikyk abiem rankom virš galvos.\n" +
                        "2) Lenk alkūnes ir leisk hantelį už galvos.\n" +
                        "3) Ištiesk rankas aukštyn, nejudindamas žastų.\n" +
                        "4) Kartok lėtai ir kontroliuotai.",
                    Tips =
                        "Alkūnes laikyk kuo arčiau galvos.\n" +
                        "Neužsiriesk per nugarą – įtrauk pilvo presą.",
                    CommonMistakes =
                        "Alkūnės išsiskleidžia į šalis.\n" +
                        "Per didelis svoris ir kontroliės nebuvimas."
                },

                new ExerciseTemplate
                {
                    Name = "Tricepso stūmimas virve žemyn treniruoklyje",
                    ImageUrl = "/exercises/triceps-pushdown.gif",
                    MusclesImageUrl = "/exercises/triceps-pushdown-muscles.png",
                    HowToImageUrl = "/exercises/triceps-pushdown-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_TRICEPS_PUSHDOWN",

                    Category = ExerciseCategory.Tricepsas,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Viršutinės traukos treniruoklis su virve",
                    PrimaryMuscles = "Tricepsas",
                    SecondaryMuscles = "Dilbiai, pečių stabilizatoriai",
                    ShortDescription = "Izoliuotas tricepso pratimas su virve, leidžiantis gerai pajusti raumenų darbą.",

                    ExecutionSteps =
                        "1) Atsistok prieš treniruoklį, suimk virvę delnais į vidų.\n" +
                        "2) Alkūnes laikyk arti šonų.\n" +
                        "3) Stumk virvę žemyn, pilnai ištiesdamas rankas.\n" +
                        "4) Lėtai grąžink virvę į viršų, nekeldamas alkūnių.",
                    Tips =
                        "Apačioje šiek tiek išskirk virvės galus į šalis.\n" +
                        "Laikyk liemenį stabilų – nesiriesk prie svorio.",
                    CommonMistakes =
                        "Alkūnės juda pirmyn ir atgal.\n" +
                        "Per didelis svoris ir „mėtymasas“."
                },

                new ExerciseTemplate
                {
                    Name = "Atsispaudimai siauru pritraukimu",
                    ImageUrl = "/exercises/close-grip-pushups.webp",
                    MusclesImageUrl = "/exercises/close-grip-pushups-muscles.png",
                    HowToImageUrl = "/exercises/close-grip-pushups-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_CLOSE_PUSHUPS",

                    Category = ExerciseCategory.Tricepsas,
                    Difficulty = ExerciseDifficulty.Intermediate,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Kūno svoris",
                    PrimaryMuscles = "Tricepsai",
                    SecondaryMuscles = "Krūtinės vidurys, priekinė deltų dalis, pilvo presas",
                    ShortDescription = "Atsispaudimų variantas, labiau apkraunantis tricepsus.",

                    ExecutionSteps =
                        "1) Užimk lentos poziciją, delnai arčiau vienas kito.\n" +
                        "2) Leiskis žemyn, alkūnes vesdamas palei kūną.\n" +
                        "3) Stumkis atgal į pradinę padėtį, išlaikydamas tiesią kūno liniją.\n" +
                        "4) Kartok kontroliuotai.",
                    Tips =
                        "Jei sunku – atlik nuo kelių.\n" +
                        "Stenkis neplatinti alkūnių į šalis.",
                    CommonMistakes =
                        "Per platus suėmimas – prarandamas tricepso akcentas.\n" +
                        "Klubai „lūžta“ ir prarandama taisyklinga linija."
                },

                // ================= PRESAS =================
                new ExerciseTemplate
                {
                    Name = "Lentos pratimas (plank)",
                    ImageUrl = "/exercises/plank.gif",
                    MusclesImageUrl = "/exercises/plank-muscles.png",
                    HowToImageUrl = "/exercises/plank-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_PLANK",

                    Category = ExerciseCategory.Presas,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Kūno svoris, kilimėlis",
                    PrimaryMuscles = "Pilvo presas, gilieji korpuso raumenys",
                    SecondaryMuscles = "Sėdmenys, pečių juosta",
                    ShortDescription = "Statinis korpuso stabilumo pratimas, stiprinantis visą liemenį.",

                    ExecutionSteps =
                        "1) Atsistok į lentą ant dilbių arba delnų.\n" +
                        "2) Laikyk kūną tiesų, sėdmenis ir pilvą įtempk.\n" +
                        "3) Kvėpuok tolygiai ir išlaikyk poziciją nustatytą laiką.",
                    Tips =
                        "Geriau trumpesnis, bet taisyklingas laikymas, nei ilgas su „nulūžusia“ forma.\n" +
                        "Stumk žemę nuo savęs per pečius, neįkritus tarp mentių.",
                    CommonMistakes =
                        "Klubai per aukštai arba per žemai.\n" +
                        "Galva „kaba“ žemyn – kaklas turi būti neutralus."
                },

                new ExerciseTemplate
                {
                    Name = "Atsilenkimai",
                    ImageUrl = "/exercises/crunches.gif",
                    MusclesImageUrl = "/exercises/crunches-muscles.png",
                    HowToImageUrl = "/exercises/crunches-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_CRUNCHES",

                    Category = ExerciseCategory.Presas,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Isolation,

                    Equipment = "Kilimėlis",
                    PrimaryMuscles = "Viršutinė pilvo preso dalis",
                    SecondaryMuscles = "Gilūs liemens raumenys",
                    ShortDescription = "Klasikinis pilvo preso pratimas, fokusuotas į viršutinę dalį.",

                    ExecutionSteps =
                        "1) Atsigulk ant nugaros, keliai sulenkti, pėdos ant žemės.\n" +
                        "2) Rankas laikyk už galvos arba ant krūtinės.\n" +
                        "3) Kelk pečius nuo žemės, traukdamas šonkaulius link dubens.\n" +
                        "4) Lėtai grįžk į pradinę padėtį, nepaleisdamas pilvo įtampos.",
                    Tips =
                        "Svarbiau judesio kokybė, o ne pakartojimų skaičius.\n" +
                        "Nespausk kaklo rankomis – judesį inicijuok pilvo raumenimis.",
                    CommonMistakes =
                        "Traukimas kaklu, o ne pilvu.\n" +
                        "Per didelis judesio amplitudės „sūpavimas“."
                },

                new ExerciseTemplate
                {
                    Name = "Kojų kėlimas kabant",
                    ImageUrl = "/exercises/hanging-leg-raise.gif",
                    MusclesImageUrl = "/exercises/hanging-leg-raise-muscles.png",
                    HowToImageUrl = "/exercises/hanging-leg-raise-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_LEG_RAISE",

                    Category = ExerciseCategory.Presas,
                    Difficulty = ExerciseDifficulty.Advanced,
                    Type = ExerciseType.Strength,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Skersinis arba pakabos diržai",
                    PrimaryMuscles = "Apatinė pilvo preso dalis, klubų lenkėjai",
                    SecondaryMuscles = "Dilbiai, pečių juosta",
                    ShortDescription = "Sudėtingas pilvo preso pratimas, reikalaujantis stipraus korpuso ir sukibimo.",

                    ExecutionSteps =
                        "1) Pakabok ant skersinio, rankos pilnai ištiestos.\n" +
                        "2) Įtempk pilvą ir kelk kelius arba tiesias kojas aukštyn.\n" +
                        "3) Sustok, kai keliai ar pėdos pasiekia klubų ar krūtinės lygį.\n" +
                        "4) Lėtai nuleisk kojas žemyn, nesiūbuodamas.",
                    Tips =
                        "Pradžioje gali kelti tik kelius, vėliau – tiesias kojas.\n" +
                        "Stenkis slopinti sūpavimą ir dirbti iš pilvo.",
                    CommonMistakes =
                        "Didelis siūbavimas iš klubo.\n" +
                        "Judėjimas tik iš klubų, neįjungiant preso."
                },

                // ================= KARDIO =================
                new ExerciseTemplate
                {
                    Name = "Bėgimas ant bėgtakio",
                    ImageUrl = "/exercises/treadmill.gif",
                    MusclesImageUrl = "/exercises/treadmill-muscles.png",
                    HowToImageUrl = "/exercises/treadmill-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_TREADMILL",

                    Category = ExerciseCategory.Kardio,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Cardio,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Bėgtakis",
                    PrimaryMuscles = "Kojos, širdies ir kraujagyslių sistema",
                    SecondaryMuscles = "Sėdmenys, blauzdos",
                    ShortDescription = "Paprastas kardio pratimas ištvermei ir širdies darbui gerinti.",

                    ExecutionSteps =
                        "1) Pasirink tinkamą greitį ir nuolydį.\n" +
                        "2) Bėk arba eik natūralia, patogia technika.\n" +
                        "3) Kontroliuok kvėpavimą ir laikyseną.",
                    Tips =
                        "Pradėk nuo 5–10 min apšilimo lėtu tempu.\n" +
                        "Naudok intervalus, jei nori intensyvesnės treniruotės.",
                    CommonMistakes =
                        "Per didelis greitis iškart.\n" +
                        "Žiūrėjimas į apačią ir sulinkusi nugara."
                },

                new ExerciseTemplate
                {
                    Name = "Dviratis treniruoklis",
                    ImageUrl = "/exercises/bike.gif",
                    MusclesImageUrl = "/exercises/bike-muscles.png",
                    HowToImageUrl = "/exercises/bike-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_BIKE",

                    Category = ExerciseCategory.Kardio,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Cardio,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Dviratis treniruoklis",
                    PrimaryMuscles = "Keturgalviai šlaunies raumenys, sėdmenys",
                    SecondaryMuscles = "Blauzdos, širdies ir kraujagyslių sistema",
                    ShortDescription = "Kardio pratimas, tausojantis sąnarius ir stiprinantis ištvermę.",

                    ExecutionSteps =
                        "1) Sureguliuok sėdynės aukštį ir pasipriešinimą.\n" +
                        "2) Suk ratą tolygiu tempu, išlaikydamas tiesią nugarą.\n" +
                        "3) Kvėpuok ritmingai ir palaikyk pastovų intensyvumą.",
                    Tips =
                        "Reguliuok pasipriešinimą pagal tikslą (ištvermė ar intervalai).\n" +
                        "Nekūprink nugaros, žvilgsnį laikyk į priekį.",
                    CommonMistakes =
                        "Per žema arba per aukšta sėdynė.\n" +
                        "Per aukštas pasipriešinimas, sukeliantis kelio skausmą."
                },

                new ExerciseTemplate
                {
                    Name = "Elipsinis treniruoklis",
                    ImageUrl = "/exercises/elliptical.gif",
                    MusclesImageUrl = "/exercises/elliptical-muscles.png",
                    HowToImageUrl = "/exercises/elliptical-howto.png",
                    VideoUrl = "https://www.youtube.com/watch?v=VIDEO_ELLIPTICAL",

                    Category = ExerciseCategory.Kardio,
                    Difficulty = ExerciseDifficulty.Beginner,
                    Type = ExerciseType.Cardio,
                    Mechanics = MechanicsType.Compound,

                    Equipment = "Elipsinis treniruoklis",
                    PrimaryMuscles = "Kojos, sėdmenys",
                    SecondaryMuscles = "Rankos (jei naudojamos rankenos), širdies ir kraujagyslių sistema",
                    ShortDescription = "Švelnus sąnariams kardio pratimas visam kūnui.",

                    ExecutionSteps =
                        "1) Užlipk ant treniruoklio ir sureguliuok pasipriešinimą.\n" +
                        "2) Judėk elipsine trajektorija, spaudamas pedalus ir, jei reikia, dirbdamas rankenomis.\n" +
                        "3) Išlaikyk ritmingą kvėpavimą ir patogų tempą.",
                    Tips =
                        "Naudok tiek kojas, tiek rankas – taip apkrausi daugiau raumenų.\n" +
                        "Pradėk nuo žemesnio pasipriešinimo ir palaipsniui didink.",
                    CommonMistakes =
                        "Per didelis pasipriešinimas iškart.\n" +
                        "Per daug remiamasi rankenomis, o ne kojomis."
                }
            };

            context.ExerciseTemplates.AddRange(templates);
            context.SaveChanges();

            // ---------------- EXERCISES (generuojami iš templates) ----------------
            var rnd = new Random();
            var exercises = new List<Exercise>();

            foreach (var workout in workouts)
            {
                IEnumerable<ExerciseTemplate> candidateTemplates;

                switch (workout.Type)
                {
                    case WorkoutType.Kardio:
                    case WorkoutType.Istvermes:
                        candidateTemplates = templates.Where(t =>
                            t.Category == ExerciseCategory.Kardio ||
                            t.Category == ExerciseCategory.Presas);
                        break;

                    case WorkoutType.Jegos:
                        candidateTemplates = templates.Where(t =>
                            t.Category == ExerciseCategory.Krutine ||
                            t.Category == ExerciseCategory.Nugara ||
                            t.Category == ExerciseCategory.Kojos ||
                            t.Category == ExerciseCategory.Peciai ||
                            t.Category == ExerciseCategory.Bicepsas ||
                            t.Category == ExerciseCategory.Tricepsas);
                        break;

                    default:
                        candidateTemplates = templates;
                        break;
                }

                var selectedTemplates = candidateTemplates
                    .OrderBy(_ => rnd.Next())
                    .Take(3)
                    .ToList();

                foreach (var tpl in selectedTemplates)
                {
                    var ex = new Exercise
                    {
                        Name = tpl.Name,
                        Sets = 3 + rnd.Next(0, 2),              // 3–4
                        Reps = 8 + rnd.Next(0, 4) * 2,          // 8,10,12,14
                        Weight = (workout.Type == WorkoutType.Kardio || tpl.Category == ExerciseCategory.Kardio)
                            ? 0
                            : 20 + rnd.Next(0, 5) * 5,          // 20–40
                        Username = workout.Username,
                        ExerciseTemplateId = tpl.Id,
                        ImageUrl = tpl.ImageUrl,
                        Workouts = new List<Workout> { workout }
                    };

                    exercises.Add(ex);
                }
            }

            context.Exercises.AddRange(exercises);
            context.SaveChanges();

            // ---------------- SAVED PLANS (daugiau išsaugotų) ----------------
            member1.SavedPlans = new List<TrainingPlan> { plans[0], plans[2], plans[6] };
            member2.SavedPlans = new List<TrainingPlan> { plans[3], plans[5] };
            member3.SavedPlans = new List<TrainingPlan> { plans[4], plans[7], plans[8] };
            member4.SavedPlans = new List<TrainingPlan> { plans[1], plans[9] };
            context.SaveChanges();

            // ---------------- COMMENTS (daugiau) ----------------
            var comments = new List<Comment>
            {
                new Comment 
                { 
                    Text = "Labai gera treniruotė!", 
                    Username = member1.Username, 
                    TrainingPlanId = plans[0].Id 
                },
                new Comment 
                { 
                    Text = "Reikėtų daugiau poilsio tarp serijų.", 
                    Username = member2.Username, 
                    WorkoutId = workouts[0].Id 
                },
                new Comment 
                { 
                    Text = "Pratimai sunkoki, bet veiksmingi.", 
                    Username = member3.Username, 
                    ExerciseId = exercises[0].Id 
                },
                new Comment 
                { 
                    Text = "Puikus planas namų sąlygomis!", 
                    Username = member4.Username, 
                    TrainingPlanId = plans[4].Id 
                },
                new Comment
                {
                    Text = "Labai patiko nugaros pratimų įvairovė.",
                    Username = member5.Username,
                    TrainingPlanId = plans[6].Id
                },
                new Comment
                {
                    Text = "Kardio planas intensyvus, bet veiksmingas.",
                    Username = member1.Username,
                    TrainingPlanId = plans[2].Id
                },
                new Comment
                {
                    Text = "Pradedančiųjų planas aiškus ir suprantamas.",
                    Username = member2.Username,
                    TrainingPlanId = plans[8].Id
                },
                new Comment
                {
                    Text = "Lankstumo pratimai labai padėjo nugarai.",
                    Username = member3.Username,
                    TrainingPlanId = plans[9].Id
                }
            };
            context.Comments.AddRange(comments);
            context.SaveChanges();

            // ---------------- RATINGS (daugiau ir įvairesni) ----------------
            var ratings = new List<Rating>
            {
                new Rating { Score = 5, Username = member1.Username, TrainingPlanId = plans[0].Id },
                new Rating { Score = 4, Username = member2.Username, TrainingPlanId = plans[0].Id },
                new Rating { Score = 5, Username = member3.Username, TrainingPlanId = plans[0].Id },

                new Rating { Score = 4, Username = member1.Username, TrainingPlanId = plans[2].Id },
                new Rating { Score = 5, Username = member4.Username, TrainingPlanId = plans[2].Id },

                new Rating { Score = 3, Username = member3.Username, TrainingPlanId = plans[4].Id },
                new Rating { Score = 2, Username = member5.Username, TrainingPlanId = plans[5].Id },

                new Rating { Score = 5, Username = member2.Username, TrainingPlanId = plans[6].Id },
                new Rating { Score = 4, Username = member4.Username, TrainingPlanId = plans[7].Id },

                new Rating { Score = 4, Username = member5.Username, TrainingPlanId = plans[8].Id },
                new Rating { Score = 5, Username = member1.Username, TrainingPlanId = plans[9].Id }
            };
            context.Ratings.AddRange(ratings);
            context.SaveChanges();

            // Tik trenerių treniruotės
            var trainerWorkouts = workouts
                .Where(w => w.Username == treneris1.Username || w.Username == treneris2.Username)
                .OrderBy(w => w.Id)
                .ToList();

            var ratings2 = new List<Rating>
            {
                // Matas treniruotės
                new Rating { Score = 5, Username = member1.Username, WorkoutId = trainerWorkouts[0].Id },
                new Rating { Score = 4, Username = member2.Username, WorkoutId = trainerWorkouts[0].Id },

                new Rating { Score = 3, Username = member3.Username, WorkoutId = trainerWorkouts[1].Id },
                new Rating { Score = 5, Username = member4.Username, WorkoutId = trainerWorkouts[1].Id },

                // Greta treniruotės
                new Rating { Score = 4, Username = member1.Username, WorkoutId = trainerWorkouts[2].Id },
                new Rating { Score = 5, Username = member5.Username, WorkoutId = trainerWorkouts[2].Id }
            };

            context.Ratings.AddRange(ratings2);
            context.SaveChanges();
        }
    }
}