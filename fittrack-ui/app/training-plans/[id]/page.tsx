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
  getTrainingPlan,
  deleteTrainingPlan,
  getTrainingPlanRating,
  rateTrainingPlan,
  deleteTrainingPlanRating,
  getTrainingPlanComments,
  createTrainingPlanComment,
  deleteComment,
  getTrainingPlanWorkouts,
} from "@/lib/api";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type TrainingPlanRatingSummary = {
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

export default function TrainingPlanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // ĮVERTINIMAS
  const [ratingSummary, setRatingSummary] =
    useState<TrainingPlanRatingSummary | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // KOMENTARAI
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // TRENIRUOTĖS PLANE
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("username");
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadPlan() {
      try {
        const data = await getTrainingPlan(Number(id));
        setPlan(data);
      } catch (err: any) {
        console.error("Klaida gaunant planą:", err);
        setError(err?.message || "Nepavyko užkrauti plano.");
        toast.error("Nepavyko užkrauti plano.", {
          description: err?.message || "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoading(false);
      }
    }

    async function loadRating() {
      try {
        setRatingLoading(true);
        setRatingError(null);
        const data = await getTrainingPlanRating(Number(id));
        setRatingSummary(data);
      } catch (err: any) {
        console.error("Klaida gaunant plano įvertinimą:", err);
        setRatingError(
          err?.message || "Nepavyko užkrauti plano įvertinimo."
        );
      } finally {
        setRatingLoading(false);
      }
    }

    async function loadComments() {
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const data = await getTrainingPlanComments(Number(id));
        setComments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Klaida gaunant plano komentarus:", err);
        setCommentsError(
          err?.message || "Nepavyko užkrauti plano komentarų."
        );
      } finally {
        setCommentsLoading(false);
      }
    }

    async function loadWorkouts() {
      try {
        setWorkoutsLoading(true);
        setWorkoutsError(null);
        const data = await getTrainingPlanWorkouts(Number(id));
        setWorkouts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Klaida gaunant plano treniruotes:", err);
        setWorkoutsError(
          err?.message || "Nepavyko užkrauti plano treniruočių."
        );
      } finally {
        setWorkoutsLoading(false);
      }
    }

    loadPlan();
    loadRating();
    loadComments();
    loadWorkouts();
  }, [id]);

  const isOwner = useMemo(
    () => !!currentUser && plan && plan.username === currentUser,
    [currentUser, plan]
  );

  const isTrainerPlan = useMemo(() => {
    const role = plan?.user?.role;
    return role === "Trainer" || role === "Treneris" || role === 1;
  }, [plan]);

  const typeLabel = plan?.type ?? "Treniruočių planas";
  const durationWeeks =
    typeof plan?.durationWeeks === "number"
      ? plan.durationWeeks
      : plan?.DurationWeeks ?? 0;

  // Žvaigždutės vidutiniam įvertinimui (su 0.5 tikslumu)
  const avgStars = useMemo(() => {
    const avg = ratingSummary?.averageScore ?? 0;
    const rounded = Math.round(avg * 2) / 2;
    const stars: ("full" | "half" | "empty")[] = [];

    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) stars.push("full");
      else if (rounded >= i - 0.5) stars.push("half");
      else stars.push("empty");
    }

    return stars;
  }, [ratingSummary?.averageScore]);

  async function handleDelete() {
    if (!plan) return;

    try {
      await deleteTrainingPlan(plan.id);
      toast.success("Planas ištrintas.", {
        description: `„${plan.name}“ sėkmingai pašalintas.`,
      });
      router.push("/training-plans");
    } catch (err) {
      console.error(err);
      toast.error("Nepavyko ištrinti plano.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  async function handleRate(score: number) {
    if (!id) return;

    try {
      await rateTrainingPlan(Number(id), score);
      toast.success("Įvertinimas išsaugotas.");

      const summary = await getTrainingPlanRating(Number(id));
      setRatingSummary(summary);
    } catch (err: any) {
      console.error("Klaida vertinant planą:", err);
      toast.error("Nepavyko išsaugoti įvertinimo.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  async function handleDeleteRating() {
    if (!id) return;

    try {
      await deleteTrainingPlanRating(Number(id));
      toast.success("Įvertinimas nuimtas.");

      const summary = await getTrainingPlanRating(Number(id));
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
      await createTrainingPlanComment(Number(id), text);
      setNewComment("");

      const data = await getTrainingPlanComments(Number(id));
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
  if (!plan) return <p className="pt-24 text-center">Planas nerastas.</p>;

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
              onClick={() => router.push("/training-plans")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <span className="text-lg">←</span>
              Atgal į planų sąrašą
            </Button>
          </div>

          {/* Pavadinimas + badge’ai */}
          <header className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {plan.name}
            </h1>

            <div className="flex flex-wrap gap-2 text-xs md:text-sm mt-2 items-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {typeLabel}
              </span>

              <span className="px-3 py-1 rounded-full bg-foreground/5 text-foreground/80 font-medium">
                Trukmė: {durationWeeks} sav.
              </span>

              {isOwner ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-medium">
                  Tavo planas
                </span>
              ) : isTrainerPlan ? (
                <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 font-medium">
                  Trenerio planas
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-foreground/5 text-foreground/70 font-medium">
                  Bendras planas
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
                    src={
                      plan.imageUrl ||
                      plan.ImageUrl ||
                      "/trainingPlans/defaultTrainingPlan.jpg"
                    }
                    alt={plan.name}
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
              {/* Santrauka */}
              <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                <h2 className="font-semibold text-lg">Plano santrauka</h2>

                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Trukmė</p>
                    <p className="font-bold text-lg">
                      {durationWeeks} sav.
                    </p>
                  </div>
                  <div className="rounded-xl bg-foreground/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Treniruotės
                    </p>
                    <p className="font-bold text-lg">
                      {workouts.length}
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

              {/* Įvertinimas (nerodome jei savas planas) */}
              {!isOwner && (
                <div className="rounded-2xl border bg-background shadow-sm p-5 space-y-3">
                  <h2 className="font-semibold text-lg">
                    Plano įvertinimas
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
                                return <HalfStar key={idx} />;
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
                          Šis planas dar neįvertintas.
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
                          Prisijunk, kad galėtum įvertinti šį planą.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Mygtukai savininkui */}
              {isOwner && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      router.push(`/training-plans/${plan.id}/edit`)
                    }
                  >
                    Redaguoti planą
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Ištrinti</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Ištrinti planą?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Ar tikrai nori ištrinti planą{" "}
                          <span className="font-semibold">
                            „{plan.name}“
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

          {/* Treniruotės šiame plane */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-lg">
                Treniruotės šiame plane
              </h2>

              {!workoutsLoading && workouts.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Iš viso treniruočių:{" "}
                  <span className="font-semibold">{workouts.length}</span>
                </span>
              )}
            </div>

            {workoutsLoading && (
              <p className="text-sm text-muted-foreground">
                Kraunamos treniruotės...
              </p>
            )}

            {!workoutsLoading && workoutsError && (
              <p className="text-sm text-red-600">{workoutsError}</p>
            )}

            {!workoutsLoading &&
              !workoutsError &&
              workouts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Šiame plane treniruočių dar nėra.
                </p>
              )}

            {!workoutsLoading &&
              !workoutsError &&
              workouts.length > 0 && (
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
                  {workouts.map((w: any) => (
                    <Card
                      key={w.id}
                      className="rounded-xl shadow hover:shadow-2xl transition flex flex-col h-full bg-background border"
                    >
                      {/* IMAGE */}
                      <div className="relative w-[90%] mx-auto mt-4 aspect-3/3 rounded-xl overflow-hidden bg-white">
                        <Image
                          src={
                            w.imageUrl ||
                            "/exercises/custom-default.jpg"
                          }
                          alt={w.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="(min-width: 1024px) 260px, (min-width: 768px) 33vw, 100vw"
                        />
                      </div>

                      {/* CONTENT */}
                      <CardContent className="p-4 flex flex-col gap-3 flex-1">
                        <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2">
                          {w.name}
                        </h3>

                        <p className="text-xs text-muted-foreground">
                          {w.date && `Data: ${formatDate(w.date)}`}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2">
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Trukmė
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {w.durationMinutes} min
                            </p>
                          </div>
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Kalorijos
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {w.caloriesBurned} kcal
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-3">
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(`/workouts/${w.id}`)
                            }
                          >
                            Žiūrėti treniruotę
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </div>

          {/* Komentarai apie planą */}
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
                  placeholder="Pasidalink savo įspūdžiais apie šį planą..."
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