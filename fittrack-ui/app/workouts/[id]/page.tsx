"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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

import {
  getWorkout,
  deleteWorkout,
  getWorkoutExercises,
  getWorkoutRating,
  rateWorkout,
  deleteWorkoutRating,
  getWorkoutComments,
  createWorkoutComment,
  deleteComment,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const workoutTypeLabels = [
  "Jėgos treniruotė",
  "Kardio",
  "Ištvermės",
  "Tempimo",
  "Funkcinė",
  "Namų",
  "Kita",
];

type WorkoutRatingSummary = {
  averageScore: number | null;
  ratingsCount: number;
  userScore: number | null;
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("lt-LT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Nežinoma data";

  return d.toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Pusinė žvaigždutė – dydį paveldi iš tėvinio elemento (font-size)
function HalfStar({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="text-muted-foreground">★</span>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: "50%" }}
      >
        <span className="text-yellow-400">★</span>
      </span>
    </span>
  );
}

export default function WorkoutDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Pratimai (kraunami atskiru endpoint'u)
  const [exercises, setExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exercisesError, setExercisesError] = useState<string | null>(null);

  // ĮVERTINIMAS
  const [ratingSummary, setRatingSummary] =
    useState<WorkoutRatingSummary | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // KOMENTARAI
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("username");
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadWorkout() {
      try {
        const data = await getWorkout(Number(id));
        setWorkout(data);
      } catch (err: any) {
        console.error("Klaida gaunant treniruotę:", err);
        setError(err?.message || "Nepavyko užkrauti treniruotės.");
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
        const data = await getWorkoutExercises(Number(id));
        setExercises(data || []);
      } catch (err: any) {
        console.error("Klaida gaunant treniruotės pratimus:", err);
        setExercisesError(
          err?.message || "Nepavyko užkrauti treniruotės pratimų."
        );
      } finally {
        setLoadingExercises(false);
      }
    }

    async function loadRating() {
      try {
        setRatingLoading(true);
        setRatingError(null);
        const data = await getWorkoutRating(Number(id));
        setRatingSummary(data);
      } catch (err: any) {
        console.error("Klaida gaunant treniruotės įvertinimą:", err);
        setRatingError(
          err?.message || "Nepavyko užkrauti treniruotės įvertinimo."
        );
      } finally {
        setRatingLoading(false);
      }
    }

    async function loadComments() {
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const data = await getWorkoutComments(Number(id));
        setComments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Klaida gaunant treniruotės komentarus:", err);
        setCommentsError(
          err?.message || "Nepavyko užkrauti treniruotės komentarų."
        );
      } finally {
        setCommentsLoading(false);
      }
    }

    loadWorkout();
    loadExercises();
    loadRating();
    loadComments();
  }, [id]);

  const isOwner = useMemo(
    () => !!currentUser && workout && workout.username === currentUser,
    [currentUser, workout]
  );

  const typeLabel =
    workout && typeof workout.type === "number"
      ? workoutTypeLabels[workout.type] ?? "Kita"
      : workout?.type ?? "Kita";

  const dateText = workout ? formatDate(workout.date) : "";

  // Žvaigždutės vidutiniam įvertinimui (su 0.5 tikslumu)
  const avgStars = useMemo(() => {
    const avg = ratingSummary?.averageScore ?? 0;
    const rounded = Math.round(avg * 2) / 2; // pvz. 4.3 -> 4.5
    const stars: ("full" | "half" | "empty")[] = [];

    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) stars.push("full");
      else if (rounded >= i - 0.5) stars.push("half");
      else stars.push("empty");
    }

    return stars;
  }, [ratingSummary?.averageScore]);

  async function handleDelete() {
    if (!workout) return;

    try {
      await deleteWorkout(workout.id);
      toast.success("Treniruotė ištrinta.", {
        description: `„${workout.name}“ sėkmingai pašalinta.`,
      });
      router.push("/workouts");
    } catch (err) {
      console.error(err);
      toast.error("Nepavyko ištrinti treniruotės.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  async function handleRate(score: number) {
    if (!id) return;

    try {
      await rateWorkout(Number(id), score);
      toast.success("Įvertinimas išsaugotas.");

      const summary = await getWorkoutRating(Number(id));
      setRatingSummary(summary);
    } catch (err: any) {
      console.error("Klaida vertinant treniruotę:", err);
      toast.error("Nepavyko išsaugoti įvertinimo.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  async function handleDeleteRating() {
    if (!id) return;

    try {
      await deleteWorkoutRating(Number(id));
      toast.success("Įvertinimas nuimtas.");

      const summary = await getWorkoutRating(Number(id));
      setRatingSummary(summary);
    } catch (err: any) {
      console.error("Klaida šalinant įvertinimą:", err);
      toast.error("Nepavyko nuimti įvertinimo.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  async function handleSubmitComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;

    const text = newComment.trim();
    if (text.length < 3) {
      toast.error("Komentaras per trumpas.", {
        description: "Minimalus ilgis – 3 simboliai.",
      });
      return;
    }

    try {
      setSubmittingComment(true);
      await createWorkoutComment(Number(id), text);
      setNewComment("");

      const data = await getWorkoutComments(Number(id));
      setComments(Array.isArray(data) ? data : []);

      toast.success("Komentaras pridėtas.");
    } catch (err: any) {
      console.error("Klaida kuriant komentarą:", err);
      toast.error("Nepavyko pridėti komentaro.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Komentaras ištrintas.");
    } catch (err: any) {
      console.error("Klaida trinant komentarą:", err);
      toast.error("Nepavyko ištrinti komentaro.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  if (loading) return <p className="pt-24 text-center">Kraunama...</p>;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!workout)
    return <p className="pt-24 text-center">Treniruotė nerasta.</p>;

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-5xl mx-auto px-4 space-y-10">
          {/* Atgal */}
          <div className="mb-2">
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

          {/* Pavadinimas + badge’ai */}
          <header className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {workout.name}
            </h1>

            <div className="flex flex-wrap gap-2 text-xs md:text-sm mt-2 items-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {typeLabel}
              </span>

              <span className="px-3 py-1 rounded-full bg-foreground/5 text-foreground/80 font-medium">
                {dateText}
              </span>

              {isOwner ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-medium">
                  Tavo treniruotė
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 font-medium">
                  Trenerio treniruotė
                </span>
              )}
            </div>
          </header>

          {/* Pagrindinis blokas */}
          <div className="grid gap-10 lg:grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] items-start">
            {/* Paveikslėlis */}
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden bg-background shadow-md border">
                <div className="relative w-full aspect-video bg-black/5">
                  <Image
                    src={workout.imageUrl || "/exercises/custom-default.jpg"}
                    alt={workout.name}
                    fill
                    unoptimized
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Šoninė panelė */}
            <aside className="space-y-5">
              <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                <h2 className="font-semibold text-lg">Treniruotės santrauka</h2>

                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Trukmė</p>
                    <p className="font-bold text-lg">
                      {workout.durationMinutes} min
                    </p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Kalorijos</p>
                    <p className="font-bold text-lg">
                      {workout.caloriesBurned} kcal
                    </p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Tipas</p>
                    <p className="font-bold text-base md:text-lg whitespace-nowrap">
                      {typeLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Įvertinimas tik trenerio treniruotėms (ne savo) */}
              {!isOwner && (
                <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                  <h2 className="font-semibold text-lg">
                    Treniruotės įvertinimas
                  </h2>

                  {ratingLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Kraunamas įvertinimas...
                    </p>
                  ) : ratingError ? (
                    <p className="text-sm text-red-600">{ratingError}</p>
                  ) : (
                    <>
                      {ratingSummary && ratingSummary.ratingsCount > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-2xl">
                            {avgStars.map((type, idx) => {
                              if (type === "full") {
                                return (
                                  <span
                                    key={idx}
                                    className="text-yellow-400"
                                  >
                                    ★
                                  </span>
                                );
                              }
                              if (type === "half") {
                                return (
                                  <HalfStar
                                    key={idx}
                                    className=""
                                  />
                                );
                              }
                              return (
                                <span
                                  key={idx}
                                  className="text-muted-foreground"
                                >
                                  ★
                                </span>
                              );
                            })}

                            <span className="ml-3 text-sm font-medium align-middle">
                              {ratingSummary.averageScore?.toFixed(1)} / 5
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ratingSummary.ratingsCount}{" "}
                            {ratingSummary.ratingsCount === 1
                              ? "įvertinimas"
                              : "įvertinimai"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Ši treniruotė dar neįvertinta.
                        </p>
                      )}

                      {currentUser ? (
                        <div className="space-y-2 mt-3">
                          <p className="text-xs text-muted-foreground">
                            Tavo įvertinimas:
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active =
                                (ratingSummary?.userScore ?? 0) >= star;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRate(star)}
                                  className={`text-3xl leading-none transition-transform ${
                                    active
                                      ? "text-yellow-400"
                                      : "text-muted-foreground"
                                  } hover:scale-110`}
                                  aria-label={`${star} žvaigždutės`}
                                >
                                  ★
                                </button>
                              );
                            })}

                            {ratingSummary?.userScore ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteRating}
                                className="ml-2 text-xs"
                              >
                                Nuimti įvertinimą
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          Prisijunk, kad galėtum įvertinti šią trenerio
                          treniruotę.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      router.push(`/workouts/${workout.id}/edit`)
                    }
                  >
                    Redaguoti treniruotę
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Ištrinti</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Ištrinti treniruotę?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Ar tikrai nori ištrinti treniruotę{" "}
                          <span className="font-semibold">
                            „{workout.name}“
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
              )}
            </aside>
          </div>

          {/* Pratimai šioje treniruotėje – stilius kaip pratimų sąraše */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-lg">
                Pratimai šioje treniruotėje
              </h2>
              {!loadingExercises && exercises.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Iš viso pratimų:{" "}
                  <span className="font-semibold">{exercises.length}</span>
                </span>
              )}
            </div>

            {loadingExercises && (
              <p className="text-sm text-muted-foreground">
                Kraunami pratimai...
              </p>
            )}

            {!loadingExercises && exercisesError && (
              <p className="text-sm text-red-600">{exercisesError}</p>
            )}

            {!loadingExercises &&
              !exercisesError &&
              exercises.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Šioje treniruotėje pratimų dar nėra.
                </p>
              )}

            {!loadingExercises &&
              !exercisesError &&
              exercises.length > 0 && (
                <div
                  className="
                    grid
                    gap-8
                    justify-center
                    grid-cols-[repeat(auto-fit,minmax(260px,1fr))]
                    max-w-5xl
                    mx-auto
                  "
                >
                  {exercises.map((ex: any) => (
                    <Card
                      key={ex.id}
                      className="rounded-xl shadow hover:shadow-2xl transition flex flex-col h-full bg-background border"
                    >
                      {/* IMAGE – toks pat feeling kaip pratimų sąraše */}
                      <div className="relative w-[90%] mx-auto mt-4 aspect-3/3 rounded-xl overflow-hidden bg-white">
                        <Image
                          src={
                            ex.imageUrl || "/exercises/custom-default.jpg"
                          }
                          alt={ex.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="(min-width: 1024px) 260px, (min-width: 768px) 33vw, 100vw"
                        />
                      </div>

                      {/* CONTENT */}
                      <CardContent className="p-4 flex flex-col gap-3 flex-1">
                        <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2">
                          {ex.name}
                        </h3>

                        <p className="text-[11px] uppercase text-muted-foreground">
                          Nustatymai šioje treniruotėje
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Serijos
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {ex.sets}
                            </p>
                          </div>
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Pakartojimai
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {ex.reps}
                            </p>
                          </div>
                          <div className="rounded-lg bg-foreground/5 px-1 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Svoris
                            </p>
                            <p className="font-semibold text-sm leading-tight xl:whitespace-nowrap">
                              {ex.weight > 0
                                ? `${ex.weight} kg`
                                : "Kūno svoris"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(`/exercises/${ex.id}`)
                            }
                          >
                            Žiūrėti pratimą
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </div>

          {/* Komentarai apie treniruotę */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Komentarai</h2>

            {commentsLoading && (
              <p className="text-sm text-muted-foreground">
                Kraunami komentarai...
              </p>
            )}

            {!commentsLoading && commentsError && (
              <p className="text-sm text-red-600">{commentsError}</p>
            )}

            {!commentsLoading &&
              !commentsError &&
              comments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Kol kas komentarų nėra. Būk pirmas, kuris pakomentuos!
                </p>
              )}

            {!commentsLoading &&
              !commentsError &&
              comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-xl border bg-background p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {c.user?.fullName || c.username}
                          </span>
                          {c.createdAt && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(c.createdAt)}
                            </span>
                          )}
                        </div>

                        {currentUser === c.username && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Ištrinti
                          </Button>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-line">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            {/* Naujo komentaro forma */}
            {currentUser ? (
              <form
                onSubmit={handleSubmitComment}
                className="mt-4 space-y-2"
              >
                <Label
                  htmlFor="newComment"
                  className="text-sm font-medium"
                >
                  Parašyk komentarą
                </Label>
                <Textarea
                  id="newComment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Pasidalink savo įspūdžiais apie šią treniruotę..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      submittingComment || newComment.trim().length < 3
                    }
                  >
                    {submittingComment ? "Siunčiama..." : "Siųsti komentarą"}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">
                Prisijunk, kad galėtum palikti komentarą.
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}