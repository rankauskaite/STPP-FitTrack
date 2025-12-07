"use client";

import { useEffect, useMemo, useState } from "react";
import { getExercise, deleteExercise } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Paprasti helperiai enum'ų rodymui (veiks ir kai ateina skaičiai)
const categoryLabels = [
  "Krūtinė",
  "Nugara",
  "Kojos",
  "Pečiai",
  "Bicepsas",
  "Tricepsas",
  "Presas",
  "Kardio",
  "Kita",
];

const difficultyLabels = ["Pradedantiesiems", "Vidutinis", "Pažengusiems"];
const typeLabels = ["Jėga", "Kardio", "Mobilumas", "Tempimas", "Kita"];
const mechanicsLabels = ["Keli sąnariai", "Izoliuotas"];

function enumToLabel(
  value: any,
  labels: string[],
  fallback?: string
): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return labels[value] ?? fallback ?? String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return fallback ?? null;
}

// YouTube nuorodą paverčiam į embed formą, jei įmanoma
function getYouTubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function ExerciseDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const data = await getExercise(Number(id));
        setExercise(data);
      } catch (err: any) {
        console.error("Klaida gaunant pratimą:", err);
        setError(err.message || "Nepavyko užkrauti pratimo.");
        toast.error("Nepavyko užkrauti pratimo.", {
          description: "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const template = exercise?.exerciseTemplate;

  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(template?.videoUrl),
    [template?.videoUrl]
  );

  const steps = useMemo(
    () =>
      (template?.executionSteps as string | undefined)
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
    [template?.executionSteps]
  );

  const tips = useMemo(
    () =>
      (template?.tips as string | undefined)
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
    [template?.tips]
  );

  const mistakes = useMemo(
    () =>
      (template?.commonMistakes as string | undefined)
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
    [template?.commonMistakes]
  );

  async function handleDelete() {
    if (!exercise) return;

    try {
      await deleteExercise(exercise.id);

      toast.success("Pratimas ištrintas.", {
        description: "Pratimas buvo sėkmingai pašalintas.",
      });

      router.push("/exercises");
    } catch (err) {
      console.error(err);
      toast.error("Nepavyko ištrinti pratimo.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  if (loading) return <p className="pt-24 text-center">Kraunama...</p>;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!exercise) return <p className="pt-24 text-center">Pratimas nerastas.</p>;

  const categoryText = enumToLabel(
    template?.category,
    categoryLabels,
    "Kita"
  );
  const difficultyText = enumToLabel(
    template?.difficulty,
    difficultyLabels,
    "—"
  );
  const typeText = enumToLabel(template?.type, typeLabels, "—");
  const mechanicsText = enumToLabel(
    template?.mechanics,
    mechanicsLabels,
    "—"
  );

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-5xl mx-auto px-4 space-y-10">
          {/* Atgal mygtukas */}
          <div className="mb-2">
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

          {/* Pavadinimas + trumpas aprašymas */}
          <header className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {exercise.name}
            </h1>

            {template?.shortDescription && (
              <p className="text-muted-foreground max-w-2xl">
                {template.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs md:text-sm mt-2">
              {categoryText && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {categoryText}
                </span>
              )}
              {difficultyText && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-medium">
                  Sunkumas: {difficultyText}
                </span>
              )}
              {typeText && (
                <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 font-medium">
                  Tipas: {typeText}
                </span>
              )}
              {mechanicsText && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-medium">
                  Mechanika: {mechanicsText}
                </span>
              )}
            </div>
          </header>

          {/* Pagrindinis blokas – čia praplatinau dešinę (Tavo nustatymai) koloną */}
          <div className="grid gap-10 lg:grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)] items-start">
            {/* KAIRĖ – pagrindinis GIF / nuotrauka */}
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden bg-background shadow-md border">
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
            </div>

            {/* DEŠINĖ – informacijos panelė */}
            <aside className="space-y-5">
              <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                <h2 className="font-semibold text-lg">Tavo nustatymai</h2>

                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Serijos</p>
                    <p className="font-bold text-lg">{exercise.sets}</p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Pakartojimai
                    </p>
                    <p className="font-bold text-lg">{exercise.reps}</p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Svoris</p>
                    <p className="font-bold text-base md:text-lg whitespace-nowrap">
                      {exercise.weight > 0 ? `${exercise.weight} kg` : "Kūno svoris"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    router.push(`/exercises/${exercise.id}/edit`)
                  }
                >
                  Redaguoti pratimą
                </Button>

                {/* Gražus trynimo dialogas */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Ištrinti
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Ištrinti pratimą?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Ar tikrai nori ištrinti pratimą{" "}
                        <span className="font-semibold">
                          „{exercise.name}“
                        </span>
                        ? Šio veiksmo atšaukti nebegalėsi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Taip, ištrinti
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </aside>
          </div>

          {/* TEKSTINĖ INFORMACIJA – 4 atskiros kortelės, 2x2 ant didesnių ekranų */}
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
            {/* Kaip atlikti */}
            <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-lg">Kaip atlikti pratimą</h2>
              {steps.length > 0 ? (
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {steps.map((s, i) => (
                    <li key={i}>{s.replace(/^\d+\)\s*/, "")}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Instrukcijos dar nepateiktos.
                </p>
              )}
            </div>

            {/* Raumenys + įranga */}
            <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-lg">Raumenys ir įranga</h2>

              <div className="space-y-2 text-sm">
                {template?.primaryMuscles && (
                  <p>
                    <span className="font-medium">Pagrindiniai raumenys:</span>{" "}
                    <span className="text-muted-foreground">
                      {template.primaryMuscles}
                    </span>
                  </p>
                )}
                {template?.secondaryMuscles && (
                  <p>
                    <span className="font-medium">Pagalbiniai raumenys:</span>{" "}
                    <span className="text-muted-foreground">
                      {template.secondaryMuscles}
                    </span>
                  </p>
                )}
                {template?.equipment && (
                  <p>
                    <span className="font-medium">Įranga:</span>{" "}
                    <span className="text-muted-foreground">
                      {template.equipment}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Patarimai */}
            <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-lg">Patarimai</h2>
              {tips.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {tips.map((t, i) => (
                    <li key={i}>{t.replace(/^\d+\)\s*/, "")}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Patarimai dar nepateikti.
                </p>
              )}
            </div>

            {/* Dažnos klaidos */}
            <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-lg">Dažnos klaidos</h2>
              {mistakes.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {mistakes.map((m, i) => (
                    <li key={i}>{m.replace(/^\d+\)\s*/, "")}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Dažnų klaidų sąrašas dar nepateiktas.
                </p>
              )}
            </div>
          </div>

          {/* Papildomos nuotraukos + video
          {template &&
            (template.musclesImageUrl ||
              template.howToImageUrl ||
              embedUrl) && (
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                {template.musclesImageUrl && (
                  <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                    <h2 className="font-semibold text-lg">Raumenų grupės</h2>
                    <div className="relative w-full aspect-4/3 bg-black/5 rounded-xl overflow-hidden">
                      <Image
                        src={template.musclesImageUrl}
                        alt={`${exercise.name} raumenų grupės`}
                        fill
                        className="object-contain p-4"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {template.howToImageUrl && (
                  <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                    <h2 className="font-semibold text-lg">Padėtys / technika</h2>
                    <div className="relative w-full aspect-4/3 bg-black/5 rounded-xl overflow-hidden">
                      <Image
                        src={template.howToImageUrl}
                        alt={`${exercise.name} atlikimo pavyzdys`}
                        fill
                        className="object-contain p-4"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {embedUrl && (
                  <div className="rounded-2xl overflow-hidden bg-background shadow-md border md:col-span-2">
                    <div className="px-5 pt-4 pb-2 border-b">
                      <h2 className="font-semibold text-lg">
                        Video demonstracija
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Peržiūrėk, kaip taisyklingai atlikti pratimą.
                      </p>
                    </div>
                    <div className="aspect-video w-full">
                      <iframe
                        src={embedUrl}
                        title={exercise.name}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            )} */}
        </section>
      </main>

      <Footer />
    </>
  );
}