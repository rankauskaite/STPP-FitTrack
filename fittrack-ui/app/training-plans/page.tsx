"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import Image from "next/image";

import {
  getTrainingPlans,
  deleteTrainingPlan,
  getTrainingPlanRating,
} from "@/lib/api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Tas pats tipas kaip WorkoutRatingSummary
type TrainingPlanRatingSummary = {
  averageScore: number | null;
  ratingsCount: number;
  userScore: number | null;
};

// Pusinė žvaigždutė – font-size paveldi iš tėvo
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

// Helperis, kuris iš vidurkio (pvz. 4.3) sugeneruoja 5 žvaigždutes su 0.5 žingsniu
function getAvgStars(
  avg: number | null | undefined
): ("full" | "half" | "empty")[] {
  const value = avg ?? 0;
  const rounded = Math.round(value * 2) / 2; // pvz. 4.3 -> 4.5
  const result: ("full" | "half" | "empty")[] = [];

  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) result.push("full");
    else if (rounded >= i - 0.5) result.push("half");
    else result.push("empty");
  }

  return result;
}

export default function TrainingPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Mapas: planId -> ratingSummary
  const [ratings, setRatings] = useState<
    Record<number, TrainingPlanRatingSummary>
  >({});

  useEffect(() => {
    const user = localStorage.getItem("username");
    setCurrentUser(user);

    async function load() {
      try {
        const data = await getTrainingPlans();
        setPlans(data);

        // Įvertinimus kraunam tik trenerių planams (t.y. ne tavo)
        const trainerPlans = user
          ? data.filter((p: any) => p.username !== user)
          : data;

        const entries = await Promise.all(
          trainerPlans.map(async (p: any) => {
            try {
              const summary = await getTrainingPlanRating(Number(p.id));
              return [p.id, summary] as const;
            } catch (err) {
              console.warn("Nepavyko gauti plano įvertinimo", p.id, err);
              return null;
            }
          })
        );

        setRatings((prev) => {
          const next = { ...prev };
          for (const entry of entries) {
            if (entry) {
              const [id, summary] = entry;
              next[id] = summary;
            }
          }
          return next;
        });
      } catch (err) {
        console.error("Klaida kraunant planus:", err);
        toast.error("Nepavyko užkrauti treniruočių planų.", {
          description: "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleDeleteConfirmed(id: number, name: string) {
    try {
      await deleteTrainingPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));

      toast.success("Planas ištrintas.", {
        description: `„${name}“ sėkmingai pašalintas iš sąrašo.`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Nepavyko ištrinti plano.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    }
  }

  const myPlans = currentUser
    ? plans.filter((p) => p.username === currentUser)
    : [];
  const trainerPlans = currentUser
    ? plans.filter((p) => p.username !== currentUser)
    : plans;

  const renderPlanCard = (p: any, i: number, isOwner: boolean) => {
    const ratingSummary = ratings[p.id];
    const hasRating =
      ratingSummary &&
      ratingSummary.ratingsCount &&
      ratingSummary.ratingsCount > 0;

    const avgValue = ratingSummary?.averageScore ?? 0;
    const stars = getAvgStars(avgValue);
    const count = ratingSummary?.ratingsCount ?? 0;
    const avgText = avgValue.toFixed(1);

    const imageUrl =
      p.imageUrl || "/trainingPlans/defaultTrainingPlan.jpg";

    return (
      <motion.div
        key={p.id}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: i * 0.05 }}
      >
        <Card className="rounded-xl shadow hover:shadow-2xl transition flex flex-col h-full">
          {/* IMAGE */}
          <div className="relative w-[90%] mx-auto mt-4 aspect-3/3 rounded-xl overflow-hidden bg-white">
            <Image
              src={imageUrl}
              alt={p.name}
              fill
              unoptimized
              className="object-cover"
              sizes="(min-width: 1024px) 260px, (min-width: 768px) 33vw, 100vw"
            />
          </div>

          {/* CONTENT */}
          <CardContent className="p-4 flex flex-col gap-3 flex-1">
            {/* Badge eilutė */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " +
                  (isOwner
                    ? "bg-primary/10 text-primary"
                    : "bg-sky-500/10 text-sky-600 dark:text-sky-300")
                }
              >
                {isOwner ? "Tavo planas" : "Trenerio planas"}
              </span>

              <span className="text-[11px] text-muted-foreground">
                {p.durationWeeks} sav.
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2">
              {p.name}
            </h3>

            <p className="text-xs text-muted-foreground">{p.type}</p>

            {/* Trenerio plano įvertinimas – visada rodome, net jei 0/5 */}
            {!isOwner && (
              <div className="flex items-center gap-1 text-sm mt-1">
                <div className="flex items-center gap-[3px] text-[18px] leading-none">
                  {stars.map((t, idx) => {
                    if (t === "full" && hasRating) {
                      return (
                        <span key={idx} className="text-yellow-400">
                          ★
                        </span>
                      );
                    }
                    if (t === "half" && hasRating) {
                      return <HalfStar key={idx} />;
                    }
                    // jei nėra įvertinimų arba "empty" – pilka žvaigždutė
                    return (
                      <span key={idx} className="text-muted-foreground">
                        ★
                      </span>
                    );
                  })}
                </div>
                <span className="ml-1 text-[11px] text-muted-foreground">
                  {avgText} / 5 • {count}{" "}
                  {count === 1 ? "įvertinimas" : "įvertinimai"}
                </span>
              </div>
            )}

            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1">
              Plano santrauka
            </p>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Trukmė
                </p>
                <p className="font-semibold text-sm leading-tight">
                  {p.durationWeeks} sav.
                </p>
              </div>
              <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Tipas
                </p>
                <p className="font-semibold text-xs leading-tight">
                  {p.type}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = `/training-plans/${p.id}`)
                }
              >
                Žiūrėti detaliau
              </Button>

              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `/training-plans/${p.id}/edit`)
                    }
                  >
                    ✏️ Redaguoti
                  </Button>

                  {/* Gražus trynimo dialogas */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">🗑️ Trinti</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Ištrinti planą?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Ar tikrai nori ištrinti planą{" "}
                          <span className="font-semibold">„{p.name}“</span>? Šio
                          veiksmo atšaukti nebegalėsi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () =>
                            await handleDeleteConfirmed(p.id, p.name)
                          }
                        >
                          Taip, ištrinti
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <>
      <Header />

      <section className="py-20 bg-foreground/4 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* HEADER ROW */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-4xl font-bold font-heading"
              >
                Treniruočių planai
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-muted-foreground mt-2"
              >
                Tavo asmeniniai planai ir trenerių parengtos programos.
              </motion.p>
            </div>

            {/* ADD BUTTON */}
            {currentUser && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Button
                  onClick={() =>
                    (window.location.href = "/training-plans/new")
                  }
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Naujas planas
                </Button>
              </motion.div>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <p className="text-center text-muted-foreground">Kraunama...</p>
          )}

          {/* Jei nieko nėra */}
          {!loading && plans.length === 0 && (
            <p className="text-center text-muted-foreground">
              Kol kas treniruočių planų nėra.
            </p>
          )}

          {/* PRISIJUNGUSIAM – atskirti blokai */}
          {!loading && currentUser && plans.length > 0 && (
            <div className="space-y-10">
              {myPlans.length > 0 && (
                <section className="space-y-4 rounded-2xl border bg-background/70 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          TU
                        </span>
                        Tavo treniruočių planai
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Asmeniškai tavo susiplanuotos programos.
                      </p>
                    </div>
                  </div>

                  <motion.div
                    className="
                      grid 
                      gap-8
                      justify-center
                      grid-cols-[repeat(auto-fit,minmax(260px,1fr))]
                      max-w-5xl
                      mx-auto
                    "
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {myPlans.map((p, i) =>
                      renderPlanCard(p, i, true)
                    )}
                  </motion.div>
                </section>
              )}

              {trainerPlans.length > 0 && (
                <section className="space-y-4 rounded-2xl border bg-background/60 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 text-xs font-bold">
                          PRO
                        </span>
                        Trenerių treniruočių planai
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Įkvėpimui ir pavyzdžiams – gali peržiūrėti ir
                        prisitaikyti sau.
                      </p>
                    </div>
                  </div>

                  <motion.div
                    className="
                      grid 
                      gap-8
                      justify-center
                      grid-cols-[repeat(auto-fit,minmax(260px,1fr))]
                      max-w-5xl
                      mx-auto
                    "
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {trainerPlans.map((p, i) =>
                      renderPlanCard(p, i, false)
                    )}
                  </motion.div>
                </section>
              )}
            </div>
          )}

          {/* NEPRISIJUNGĘS – visi matomi planai (iš esmės trenerių vieši) */}
          {!loading && !currentUser && plans.length > 0 && (
            <motion.div
              className="
                grid 
                gap-8
                justify-center
                grid-cols-[repeat(auto-fit,minmax(260px,1fr))]
                max-w-5xl
                mx-auto
              "
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {plans.map((p, i) =>
                renderPlanCard(p, i, false)
              )}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}