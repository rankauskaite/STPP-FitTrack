"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getWorkouts, createTrainingPlan } from "@/lib/api";

const trainingPlanTypeOptions = [
  { value: "Raumenų auginimo planas", label: "Raumenų auginimo planas" },
  { value: "Svorio metimo planas", label: "Svorio metimo planas" },
  { value: "Ištvermės planas", label: "Ištvermės planas" },
  { value: "Lankstumo / mobilumo planas", label: "Lankstumo / mobilumo planas" },
  { value: "Sveikos gyvensenos planas", label: "Sveikos gyvensenos planas" },
  { value: "Kitas", label: "Kitas" },
];

type Errors = {
  name: string;
  durationWeeks: string;
  type: string;
};

export default function NewTrainingPlanPage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null); // ⬅️ NAUJA

  // --- pagrindiniai laukai ---
  const [name, setName] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [type, setType] = useState<string>(trainingPlanTypeOptions[0].value);
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [errors, setErrors] = useState<Errors>({
    name: "",
    durationWeeks: "",
    type: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- treniruočių pasirinkimas ---
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<number[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);

    const canSetPublic = role === "Trainer"; // tik treneris mato / valdo viešumą
  useEffect(() => {
    // rolė iš localStorage (login metu tu ją jau ten dedi)
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);

    // jei ne treneris – iš karto užtikrinam, kad isPublic = false
    if (storedRole !== "Trainer") {
      setIsPublic(false);
    }
  }, []);

  useEffect(() => {
    async function loadWorkouts() {
      setLoadingWorkouts(true);
      try {
        const data = await getWorkouts();
        setWorkouts(data || []);
      } catch (err) {
        console.error("Klaida kraunant treniruotes:", err);
        setWorkoutsError("Nepavyko užkrauti treniruočių.");
        toast.error("Nepavyko užkrauti treniruočių.", {
          description: "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoadingWorkouts(false);
      }
    }

    loadWorkouts();
  }, []);

  function toggleWorkout(id: number) {
    setSelectedWorkoutIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validate() {
    const e: Errors = {
      name: "",
      durationWeeks: "",
      type: "",
    };
    let ok = true;

    if (!name.trim()) {
      e.name = "Plano pavadinimas privalomas.";
      ok = false;
    }

    if (!durationWeeks || durationWeeks <= 0) {
      e.durationWeeks = "Trukmė turi būti teigiamas savaitų skaičius.";
      ok = false;
    }

    if (!type.trim()) {
      e.type = "Pasirink plano tipą.";
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
      toast.error("Pirmiausia prisijunk, kad galėtum kurti treniruočių planus.");
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        name: name.trim(),
        durationWeeks,
        type,
        isPublic: canSetPublic ? isPublic : false,
        // ImageUrl ir IsApproved paliekam backend'o default
      };

      await createTrainingPlan(body, token, selectedWorkoutIds);

      toast.success("Treniruočių planas sukurtas!", {
        description:
          selectedWorkoutIds.length > 0
            ? `${name} su ${selectedWorkoutIds.length} treniruotėmis sėkmingai pridėtas.`
            : `${name} sėkmingai pridėtas prie tavo planų.`,
      });

      router.push("/training-plans");
    } catch (err) {
      console.error("Klaida kuriant treniruočių planą:", err);
      toast.error("Nepavyko sukurti plano.", {
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
              onClick={() => router.push("/training-plans")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <span className="text-lg">←</span>
              Atgal į planų sąrašą
            </Button>
          </div>

          {/* Antraštė */}
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Naujas treniruočių planas
            </h1>
            <p className="text-muted-foreground">
              Susikurk kelių savaičių treniruočių planą ir priskirk savo treniruotes.
            </p>
          </header>

          {/* Forma kortelėje */}
          <div className="rounded-2xl border bg-background shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pavadinimas */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Plano pavadinimas
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                    errors.name ? "border-red-500" : "border-input"
                  }`}
                  placeholder="Pvz.: 4 savaičių jėgos planas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Trukmė + tipas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Trukmė (savaitėmis)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.durationWeeks ? "border-red-500" : "border-input"
                    }`}
                    value={durationWeeks}
                    onChange={(e) =>
                      setDurationWeeks(Number(e.target.value))
                    }
                  />
                  {errors.durationWeeks && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.durationWeeks}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Plano tipas
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.type ? "border-red-500" : "border-input"
                    }`}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {trainingPlanTypeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-xs text-red-600 mt-1">{errors.type}</p>
                  )}
                </div>
              </div>

              {/* Viešumo nustatymas */}
              {canSetPublic && (
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    Viešas planas
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Pažymėjus, planą galės matyti ir naudoti kiti (pagal tavo rolės taisykles).
                  </p>
                </div>
              )}

              {/* Treniruotės plane */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      Treniruotės šiame plane
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Pasirink treniruotes, kurias nori įtraukti į šį planą.
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/workouts/new")}
                    className="whitespace-nowrap"
                  >
                    <span className="text-lg mr-1">+</span>
                    Nauja treniruotė
                  </Button>
                </div>

                <div className="rounded-xl border bg-foreground/5 p-3 max-h-72 overflow-y-auto space-y-2">
                  {loadingWorkouts && (
                    <p className="text-xs text-muted-foreground">
                      Kraunamos treniruotės...
                    </p>
                  )}

                  {workoutsError && (
                    <p className="text-xs text-red-600">
                      {workoutsError} – vėliau galėsi pridėti treniruotes iš plano lango.
                    </p>
                  )}

                  {!loadingWorkouts &&
                    !workoutsError &&
                    workouts.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Šiuo metu neturi sukurtų treniruočių. Pirmiausia sukurk bent vieną skiltyje „Treniruotės“.
                      </p>
                    )}

                  {!loadingWorkouts && workouts.length > 0 && (
                    <div className="space-y-2">
                      {workouts.map((w) => {
                        const checked = selectedWorkoutIds.includes(w.id);
                        return (
                          <label
                            key={w.id}
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
                                onChange={() => toggleWorkout(w.id)}
                              />
                              <div>
                                <p className="font-medium leading-snug">
                                  {w.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Trukmė: {w.durationMinutes} min • Kalorijos:{" "}
                                  {w.caloriesBurned} kcal
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
                  {isSubmitting ? "Saugoma..." : "Sukurti planą"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/training-plans")}
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