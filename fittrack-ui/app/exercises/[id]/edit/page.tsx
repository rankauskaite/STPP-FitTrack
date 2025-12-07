"use client";

import { useState, useEffect } from "react";
import { getExercise, updateExercise } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditExercisePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    name: "",
    sets: "",
    reps: "",
    weight: "",
  });

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const data = await getExercise(Number(id));
        setExercise(data);
      } catch (err: any) {
        console.error("Klaida gaunant pratimą:", err);
        setError(err.message || "Nepavyko užkrauti pratimo.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function validate() {
    if (!exercise) return false;

    const isTemplateBased =
      !!exercise.exerciseTemplateId || !!exercise.exerciseTemplate;

    const e = {
      name: "",
      sets: "",
      reps: "",
      weight: "",
    };
    let ok = true;

    // Jei pratimas iš šablono – pavadinimo netikrinam
    if (!isTemplateBased) {
      if (!exercise.name || !exercise.name.trim()) {
        e.name = "Pavadinimas privalomas.";
        ok = false;
      }
    }

    if (!exercise.sets || exercise.sets <= 0) {
      e.sets = "Serijų skaičius turi būti teigiamas.";
      ok = false;
    }

    if (!exercise.reps || exercise.reps <= 0) {
      e.reps = "Pakartojimų skaičius turi būti teigiamas.";
      ok = false;
    }

    if (exercise.weight < 0) {
      e.weight = "Svoris negali būti neigiamas.";
      ok = false;
    }

    setErrors(e);
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise) return;

    if (!validate()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Pirmiausia prisijunk, kad galėtum redaguoti pratimus.");
      return;
    }

    try {
      setSaving(true);

      // Siunčiam tik tai, ką backend'as realiai naudoja
      await updateExercise(
        exercise.id,
        {
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
        },
        token
      );

      toast.success("Pratimas išsaugotas!", {
        description: "Atnaujinti nustatymai pritaikyti šiam pratimui.",
      });

      router.push(`/exercises/${exercise.id}`);
    } catch (err: any) {
      console.error("Klaida išsaugant pratimą:", err);
      toast.error("Nepavyko išsaugoti pakeitimų.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="pt-24 text-center">Kraunama...</p>;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!exercise) return <p className="pt-24 text-center">Pratimas nerastas.</p>;

  const template = exercise.exerciseTemplate;
  const isTemplateBased =
    !!exercise.exerciseTemplateId || !!exercise.exerciseTemplate;

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
              Redaguoti pratimą
            </h1>
            <p className="text-muted-foreground">
              Pakoreguok serijas, pakartojimus ir svorį, jei keičiasi tavo
              programa.
            </p>
          </header>

          {/* Kortelė su forma + preview */}
          <div className="rounded-2xl border bg-background shadow-sm p-6 md:p-8 space-y-6">
            {/* Viršuje – preview + trumpa info */}
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
              {/* Pagrindinė nuotrauka / GIF */}
              <div className="rounded-2xl overflow-hidden bg-foreground/5 border">
                <div className="relative w-full aspect-3/3 bg-black/5">
                  <Image
                    src={
                      exercise.imageUrl ||
                      template?.imageUrl ||
                      "/exercises/custom-default.jpg"
                    }
                    alt={exercise.name}
                    fill
                    unoptimized
                    className="object-contain p-4"
                  />
                </div>
              </div>

              {/* Šalia – trumpa info */}
              <div className="space-y-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Pratimas
                </p>
                <p className="text-lg font-semibold">{exercise.name}</p>

                {template && (
                  <p className="text-xs text-muted-foreground">
                    Sukurtas pagal šabloną:{" "}
                    <span className="font-medium">{template.name}</span>
                  </p>
                )}

                <div className="grid grid-cols-3 gap-3 text-center mt-4">
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Serijos
                    </p>
                    <p className="font-bold text-lg">{exercise.sets}</p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Pakartojimai
                    </p>
                    <p className="font-bold text-lg">{exercise.reps}</p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Svoris
                    </p>
                    <p className="font-bold text-lg">
                      {exercise.weight > 0 ? `${exercise.weight} kg` : "Kūno svoris"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Forma */}
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
              {/* Pavadinimas */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Pratimo pavadinimas
                  </label>
                  {isTemplateBased && (
                    <span className="text-[11px] text-muted-foreground">
                      Pavadinimas nustatytas pagal šabloną
                    </span>
                  )}
                </div>

                <input
                  className={`w-full px-3 py-2 border rounded-md bg-background text-sm ${
                    errors.name && !isTemplateBased
                      ? "border-red-500"
                      : "border-input"
                  } ${
                    isTemplateBased
                      ? "opacity-70 cursor-not-allowed bg-muted"
                      : ""
                  }`}
                  value={exercise.name}
                  onChange={(e) =>
                    setExercise({ ...exercise, name: e.target.value })
                  }
                  placeholder="Pvz.: Atsispaudimai"
                  disabled={isTemplateBased}
                />
                {!isTemplateBased && errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

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
                    value={exercise.sets}
                    onChange={(e) =>
                      setExercise({
                        ...exercise,
                        sets: Number(e.target.value),
                      })
                    }
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
                    value={exercise.reps}
                    onChange={(e) =>
                      setExercise({
                        ...exercise,
                        reps: Number(e.target.value),
                      })
                    }
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
                    value={exercise.weight}
                    onChange={(e) =>
                      setExercise({
                        ...exercise,
                        weight: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Jei pratimas atliekamas tik su kūno svoriu – palik 0.
                  </p>
                  {errors.weight && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.weight}
                    </p>
                  )}
                </div>
              </div>

              {/* Veiksmai */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="font-semibold"
                >
                  {saving ? "Saugoma..." : "Išsaugoti pakeitimus"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/exercises/${exercise.id}`)}
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