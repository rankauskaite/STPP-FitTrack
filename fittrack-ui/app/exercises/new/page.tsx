"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createExercise, getExerciseTemplates } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// enum indeksai = tavo ExerciseCategory tvarka
const categoryOptions = [
  { value: 0, label: "Krūtinė" },
  { value: 1, label: "Nugara" },
  { value: 2, label: "Kojos" },
  { value: 3, label: "Pečiai" },
  { value: 4, label: "Bicepsas" },
  { value: 5, label: "Tricepsas" },
  { value: 6, label: "Presas" },
  { value: 7, label: "Kardio" },
  { value: 8, label: "Kita" },
];

type ExerciseTemplateDto = {
  id: number;
  name: string;
  category: number; // ExerciseCategory (0..8)
};

type Mode = "template" | "custom";

export default function NewExercisePage() {
  const router = useRouter();

  // --- režimas: iš šablono ar custom ---
  const [mode, setMode] = useState<Mode>("template");

  // --- šablonai iš API ---
  const [templates, setTemplates] = useState<ExerciseTemplateDto[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // --- formos laukai ---
  const [name, setName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  const [errors, setErrors] = useState({
    name: "",
    sets: "",
    reps: "",
    weight: "",
    template: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💾 užkraunam šablonus
  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await getExerciseTemplates();
        setTemplates(data);

        // jei netyčia nėra šablonų – pereinam į custom režimą
        if (!data || data.length === 0) {
          setMode("custom");
        }
      } catch (err) {
        console.error("Nepavyko užkrauti šablonų:", err);
        setTemplatesError("Nepavyko užkrauti pratimo šablonų.");
        setMode("custom");
      }
    }

    loadTemplates();
  }, []);

  // filtrai pagal pasirinktą kategoriją
  const filteredTemplates =
    selectedCategory === ""
      ? templates
      : templates.filter(
          (t) => t.category === Number(selectedCategory)
        );

  function validate() {
    const e = {
      name: "",
      sets: "",
      reps: "",
      weight: "",
      template: "",
    };
    let ok = true;

    if (mode === "custom") {
      if (!name.trim()) {
        e.name = "Pratimo pavadinimas privalomas.";
        ok = false;
      }
    } else {
      // mode === "template"
      if (!selectedTemplateId) {
        e.template = "Pasirink pratimo šabloną.";
        ok = false;
      }
    }

    if (!sets || sets <= 0) {
      e.sets = "Serijų skaičius turi būti teigiamas.";
      ok = false;
    }

    if (!reps || reps <= 0) {
      e.reps = "Pakartojimų skaičius turi būti teigiamas.";
      ok = false;
    }

    if (weight < 0) {
      e.weight = "Svoris negali būti neigiamas.";
      ok = false;
    }

    setErrors(e);
    return ok;
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Pirmiausia prisijunk, kad galėtum kurti pratimus.");
      return;
    }

    try {
      setIsSubmitting(true);

      let body: any;

      if (mode === "template") {
        body = {
          exerciseTemplateId: Number(selectedTemplateId),
          sets,
          reps,
          weight,
        };
      } else {
        body = {
          name: name.trim(),
          sets,
          reps,
          weight,
        };
      }

      await createExercise(body, token);

      toast.success("Pratimas sukurtas!", {
        description:
          mode === "template"
            ? "Pratimas sukurtas pagal pasirinktą šabloną."
            : `${name} sėkmingai pridėtas prie tavo pratimų.`,
      });

      router.push("/exercises");
    } catch (err) {
      console.error("Klaida kuriant pratimą:", err);
      toast.error("Nepavyko sukurti pratimo.", {
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
              onClick={() => router.push("/exercises")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <span className="text-lg">←</span>
              Atgal į pratimų sąrašą
            </Button>
          </div>

          {/* Antraštė */}
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Naujas pratimas
            </h1>
            <p className="text-muted-foreground">
              Pasirink pratimą iš šablonų pagal raumenų grupę arba susikurk
              savo.
            </p>
          </header>

          {/* Info apie šablonų klaidą, jei buvo */}
          {templatesError && (
            <p className="text-xs text-amber-600">
              {templatesError} – gali kurti savo pratimą.
            </p>
          )}

          {/* Forma kortelėje */}
          <div className="rounded-2xl border bg-background shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Režimo pasirinkimas */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Pratimo tipas</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={mode === "template" ? "default" : "outline"}
                    onClick={() => {
                      setMode("template");
                      setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                  >
                    Naudoti pratimo šabloną
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "custom" ? "default" : "outline"}
                    onClick={() => {
                      setMode("custom");
                      setSelectedTemplateId("");
                      setSelectedCategory("");
                      setErrors((prev) => ({ ...prev, template: "" }));
                    }}
                  >
                    Kurti savo pratimą
                  </Button>
                </div>
              </div>

              {/* Jei REŽIMAS = ŠABLONAS */}
              {mode === "template" && (
                <div className="space-y-4">
                  {/* Kategorija + šablonas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Raumenų grupė */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        Raumenų grupė
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm border-input"
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setSelectedTemplateId("");
                          setErrors((prev) => ({ ...prev, template: "" }));
                        }}
                      >
                        <option value="">Visos grupės</option>
                        {categoryOptions.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pirmiausia gali atsifiltruoti grupę, pvz. krūtinė ar
                        nugara.
                      </p>
                    </div>

                    {/* Konkretaus pratimo pasirinkimas */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        Pratimo šablonas
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                          errors.template ? "border-red-500" : "border-input"
                        }`}
                        value={selectedTemplateId}
                        onChange={(e) => {
                          setSelectedTemplateId(e.target.value);
                          setErrors((prev) => ({ ...prev, template: "" }));
                        }}
                      >
                        <option value="">
                          {filteredTemplates.length > 0
                            ? "Pasirink konkretaus pratimo šabloną"
                            : "Pagal pasirinktą grupę šablonų nėra"}
                        </option>
                        {filteredTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      {errors.template && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.template}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Jei REŽIMAS = CUSTOM – pavadinimo įvedimas */}
              {mode === "custom" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Pratimo pavadinimas
                  </label>
                  <input
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.name ? "border-red-500" : "border-input"
                    }`}
                    placeholder="Pvz.: Atsispaudimai, Štangos spaudimas gulint"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>
              )}

              {/* Skaičiai – serijos, pakartojimai, svoris */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Serijos */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Serijos</label>
                  <input
                    type="number"
                    min={1}
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.sets ? "border-red-500" : "border-input"
                    }`}
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                  />
                  {errors.sets && (
                    <p className="text-xs text-red-600 mt-1">{errors.sets}</p>
                  )}
                </div>

                {/* Pakartojimai */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Pakartojimai</label>
                  <input
                    type="number"
                    min={1}
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.reps ? "border-red-500" : "border-input"
                    }`}
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                  />
                  {errors.reps && (
                    <p className="text-xs text-red-600 mt-1">{errors.reps}</p>
                  )}
                </div>

                {/* Svoris */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Svoris (kg)</label>
                  <input
                    type="number"
                    min={0}
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                      errors.weight ? "border-red-500" : "border-input"
                    }`}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Jei pratimas atliekamas su kūno svoriu – palik 0.
                  </p>
                  {errors.weight && (
                    <p className="text-xs text-red-600 mt-1">{errors.weight}</p>
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
                  {isSubmitting ? "Saugoma..." : "Sukurti pratimą"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/exercises")}
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
