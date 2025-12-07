"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createWorkout,
  getExercises,
  addExercisesToWorkout,
} from "@/lib/api";

const workoutTypeOptions = [
  { value: 0, label: "Jėgos treniruotė" },
  { value: 1, label: "Kardio" },
  { value: 2, label: "Ištvermės" },
  { value: 3, label: "Tempimo" },
  { value: 4, label: "Funkcinė" },
  { value: 5, label: "Namų" },
  { value: 6, label: "Kita" },
];

type Errors = {
  name: string;
  date: string;
  duration: string;
  calories: string;
};

export default function NewWorkoutPage() {
  const router = useRouter();

  // --- pagrindiniai laukai ---
  const [name, setName] = useState("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [type, setType] = useState<string>("0");
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(300);

  const [errors, setErrors] = useState<Errors>({
    name: "",
    date: "",
    duration: "",
    calories: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- pratimų pasirinkimas ---
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exercisesError, setExercisesError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      setLoadingExercises(true);
      try {
        const data = await getExercises();
        setExercises(data || []);
      } catch (err) {
        console.error("Klaida kraunant pratimus:", err);
        setExercisesError("Nepavyko užkrauti pratimų.");
        toast.error("Nepavyko užkrauti pratimų.", {
          description: "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoadingExercises(false);
      }
    }

    loadExercises();
  }, []);

  function toggleExercise(id: number) {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validate() {
    const e: Errors = {
      name: "",
      date: "",
      duration: "",
      calories: "",
    };
    let ok = true;

    if (!name.trim()) {
      e.name = "Treniruotės pavadinimas privalomas.";
      ok = false;
    }

    if (!date) {
      e.date = "Pasirink treniruotės datą.";
      ok = false;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      e.duration = "Trukmė turi būti teigiamas skaičius.";
      ok = false;
    }

    if (caloriesBurned < 0) {
      e.calories = "Kalorijos negali būti neigiamos.";
      ok = false;
    }

    setErrors(e);
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Pirmiausia prisijunk, kad galėtum kurti treniruotes.");
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        name: name.trim(),
        date: `${date}T00:00:00`,
        type: Number(type),
        durationMinutes,
        caloriesBurned,
      };

      const createdWorkout = await createWorkout(body, token);

      if (createdWorkout?.id && selectedExerciseIds.length > 0) {
        try {
          await addExercisesToWorkout(
            createdWorkout.id,
            selectedExerciseIds,
            token
          );
        } catch (err) {
          console.error("Nepavyko priskirti pratimų treniruotei:", err);
          toast.warning(
            "Treniruotė sukurta, bet nepavyko pridėti pratimų.",
            {
              description:
                "Vėliau galėsi pridėti pratimus iš treniruotės lango.",
            }
          );
        }
      }

      toast.success("Treniruotė sukurta!", {
        description:
          selectedExerciseIds.length > 0
            ? `${name} su ${selectedExerciseIds.length} pratimais sėkmingai pridėta.`
            : `${name} sėkmingai pridėta prie tavo treniruočių.`,
      });

      router.push("/workouts");
    } catch (err) {
      console.error("Klaida kuriant treniruotę:", err);
      toast.error("Nepavyko sukurti treniruotės.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-3xl mx-auto px-4 space-y-8">
          {/* Atgal mygtukas */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/workouts")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <span className="text-lg">←</span>
              Atgal į treniruočių sąrašą
            </Button>
          </div>

          {/* Antraštė */}
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Nauja treniruotė
            </h1>
            <p className="text-muted-foreground">
              Susiplanuok treniruotę: pasirink tipą, datą, trukmę, kalorijas ir
              pridėk pratimus iš savo sąrašo.
            </p>
          </header>

          {/* Forma kortelėje */}
          <div className="rounded-2xl border bg-background shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pavadinimas */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Treniruotės pavadinimas
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                    errors.name ? "border-red-500" : "border-input"
                  }`}
                  placeholder="Pvz.: Viršutinės kūno dalies treniruotė"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Data + tipas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Data</label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.date ? "border-red-500" : "border-input"
                    }`}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-600 mt-1">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Treniruotės tipas
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm border-input"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {workoutTypeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trukmė + kalorijos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Trukmė (minutėmis)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.duration ? "border-red-500" : "border-input"
                    }`}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(Number(e.target.value))
                    }
                  />
                  {errors.duration && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Sudegintos kalorijos (kcal)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.calories ? "border-red-500" : "border-input"
                    }`}
                    value={caloriesBurned}
                    onChange={(e) =>
                      setCaloriesBurned(Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Jei nežinai tiksliai – gali įrašyti apytikslį skaičių.
                  </p>
                  {errors.calories && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.calories}
                    </p>
                  )}
                </div>
              </div>

              {/* Pratimų pasirinkimas + naujas pratimas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      Pratimai šiai treniruotei
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Pasirink kelis pratimus iš sąrašo arba susikurk naują.
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/exercises/new")}
                    className="whitespace-nowrap"
                  >
                    <span className="text-lg mr-1">+</span>
                    Naujas pratimas
                  </Button>
                </div>

                <div className="rounded-xl border bg-foreground/5 p-3 max-h-72 overflow-y-auto space-y-2">
                  {loadingExercises && (
                    <p className="text-xs text-muted-foreground">
                      Kraunami pratimai...
                    </p>
                  )}

                  {exercisesError && (
                    <p className="text-xs text-red-600">
                      {exercisesError} – vėliau galėsi pridėti pratimus iš
                      treniruotės lango.
                    </p>
                  )}

                  {!loadingExercises &&
                    !exercisesError &&
                    exercises.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Neturi sukurtų pratimų. Pirmiausia sukurk bent vieną
                        pratimą skiltyje „Pratimai“.
                      </p>
                    )}

                  {!loadingExercises && exercises.length > 0 && (
                    <div className="space-y-2">
                      {exercises.map((ex) => {
                        const checked = selectedExerciseIds.includes(ex.id);
                        return (
                          <label
                            key={ex.id}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm bg-background ${
                              checked
                                ? "border-primary/60 bg-primary/5"
                                : "border-border hover:bg-foreground/5"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={checked}
                                onChange={() => toggleExercise(ex.id)}
                              />
                              <div>
                                <p className="font-medium leading-snug">
                                  {ex.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Serijos: {ex.sets} • Pakartojimai: {ex.reps}{" "}
                                  {ex.weight > 0 &&
                                    `• Svoris: ${ex.weight} kg`}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1 text-center text-[11px] sm:text-[10px]">
                              <div className="rounded-md bg-foreground/5 px-2 py-1">
                                <p className="uppercase tracking-wide text-muted-foreground">
                                  Serijos
                                </p>
                                <p className="font-semibold text-xs">
                                  {ex.sets}
                                </p>
                              </div>
                              <div className="rounded-md bg-foreground/5 px-2 py-1">
                                <p className="uppercase tracking-wide text-muted-foreground">
                                  Pakartojimai
                                </p>
                                <p className="font-semibold text-xs">
                                  {ex.reps}
                                </p>
                              </div>
                              <div className="rounded-md bg-foreground/5 px-2 py-1">
                                <p className="uppercase tracking-wide text-muted-foreground">
                                  Svoris
                                </p>
                                <p className="font-semibold text-xs">
                                  {ex.weight > 0
                                    ? `${ex.weight} kg`
                                    : "Kūno svoris"}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Veiksmai */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-semibold"
                >
                  {isSubmitting ? "Saugoma..." : "Sukurti treniruotę"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/workouts")}
                >
                  Atšaukti
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}