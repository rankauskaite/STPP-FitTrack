"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getWorkout,
  updateWorkout,
  getExercises,
  getWorkoutExercises,
  addExercisesToWorkout,
  removeExercisesFromWorkout,
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

function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
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
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
  const [initialExerciseIds, setInitialExerciseIds] = useState<number[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exercisesError, setExercisesError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadWorkout() {
      try {
        const data = await getWorkout(Number(id));
        setWorkout(data);

        setName(data.name ?? "");
        setDate(toInputDate(data.date) || "");
        const typeValue =
          typeof data.type === "number" ? String(data.type) : "0";
        setType(typeValue);
        setDurationMinutes(data.durationMinutes ?? 45);
        setCaloriesBurned(data.caloriesBurned ?? 300);
      } catch (err: any) {
        console.error("Klaida gaunant treniruotę:", err);
        toast.error("Nepavyko užkrauti treniruotės.", {
          description: err?.message || "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoading(false);
      }
    }

    async function loadExercises() {
      try {
        setLoadingExercises(true);
        setExercisesError(null);

        const [all, inWorkout] = await Promise.all([
          getExercises(),
          getWorkoutExercises(Number(id)),
        ]);

        setAllExercises(all || []);
        const ids = (inWorkout || []).map((ex: any) => ex.id);
        setSelectedExerciseIds(ids);
        setInitialExerciseIds(ids);
      } catch (err: any) {
        console.error("Klaida kraunant pratimų sąrašą:", err);
        setExercisesError(
          err?.message || "Nepavyko užkrauti treniruotės pratimų."
        );
      } finally {
        setLoadingExercises(false);
      }
    }

    loadWorkout();
    loadExercises();
  }, [id]);

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
    if (!workout) return;
    if (!validate()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Pirmiausia prisijunk, kad galėtum redaguoti treniruotes.");
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        id: workout.id,
        name: name.trim(),
        date: `${date}T00:00:00`,
        type: Number(type),
        durationMinutes,
        caloriesBurned,
      };

      // 1️⃣ Atnaujinam pačią treniruotę
      await updateWorkout(workout.id, body, token);

      // 2️⃣ Suskaičiuojam, kuriuos pratimus reikia pridėti ir kuriuos pašalinti
      const toAdd = selectedExerciseIds.filter(
        (id) => !initialExerciseIds.includes(id)
      );
      const toRemove = initialExerciseIds.filter(
        (id) => !selectedExerciseIds.includes(id)
      );

      // 3️⃣ Pridedam naujus pratimus
      if (toAdd.length > 0) {
        try {
          await addExercisesToWorkout(workout.id, toAdd, token);
        } catch (err) {
          console.error("Nepavyko pridėti visų pratimų:", err);
          toast.warning("Treniruotė atnaujinta, bet ne visi pratimai pridėti.", {
            description:
              "Vėliau pabandyk dar kartą pridėti trūkstamus pratimus.",
          });
        }
      }

      // 4️⃣ Pašalinam nuimtus pratimus
      if (toRemove.length > 0) {
        try {
          await removeExercisesFromWorkout(workout.id, toRemove, token);
        } catch (err) {
          console.error("Nepavyko pašalinti visų pratimų:", err);
          toast.warning(
            "Treniruotė atnaujinta, bet ne visi pratimai pašalinti.",
            {
              description:
                "Vėliau pabandyk dar kartą pašalinti nereikalingus pratimus.",
            }
          );
        }
      }

      toast.success("Treniruotė atnaujinta.", {
        description: `${name} sėkmingai išsaugota.`,
      });

      router.push(`/workouts/${workout.id}`);
    } catch (err) {
      console.error("Klaida atnaujinant treniruotę:", err);
      toast.error("Nepavyko atnaujinti treniruotės.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <p className="pt-24 text-center">Kraunama...</p>;
  }

  if (!workout) {
    return <p className="pt-24 text-center">Treniruotė nerasta.</p>;
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
              onClick={() => router.push(`/workouts/${workout.id}`)}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <span className="text-lg">←</span>
              Atgal į treniruotės peržiūrą
            </Button>
          </div>

          {/* Antraštė */}
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Redaguoti treniruotę
            </h1>
            <p className="text-muted-foreground">
              Atnaujink treniruotės informaciją: pavadinimą, datą, tipą,
              parametrus ir pratimus.
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
                  {errors.calories && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.calories}
                    </p>
                  )}
                </div>
              </div>

              {/* Pratimų pasirinkimas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      Pratimai šiai treniruotei
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Pažymėk, kuriuos pratimus nori palikti šiame
                      užsiėmime. Nuėmus varnelę pratimas bus pašalintas.
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
                      {exercisesError} – treniruotė bus išsaugota be
                      pratimų pakeitimų.
                    </p>
                  )}

                  {!loadingExercises &&
                    !exercisesError &&
                    allExercises.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Neturi sukurtų pratimų. Pirmiausia sukurk bent
                        vieną pratimą skiltyje „Pratimai“.
                      </p>
                    )}

                  {!loadingExercises &&
                    !exercisesError &&
                    allExercises.length > 0 && (
                      <div className="space-y-2">
                        {allExercises.map((ex) => {
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
                                    Serijos: {ex.sets} • Pakartojimai:{" "}
                                    {ex.reps}{" "}
                                    {ex.weight > 0 &&
                                      `• Svoris: ${ex.weight} kg`}
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
                  {isSubmitting ? "Saugoma..." : "Išsaugoti pakeitimus"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/workouts/${workout.id}`)}
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