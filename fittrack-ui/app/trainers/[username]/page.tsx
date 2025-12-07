"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import Image from "next/image";

import { getTrainers, getTrainingPlans, getTrainingPlanRating } from "@/lib/api";

type TrainerDto = any;

type TrainingPlanRatingSummary = {
  averageScore: number | null;
  ratingsCount: number;
  userScore: number | null;
};

// Pusinė žvaigždutė – kaip TrainingPlansPage
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

// Helperis vidurkiui → 5 žvaigždutės su 0.5 žingsniu
function getAvgStars(
  avg: number | null | undefined
): ("full" | "half" | "empty")[] {
  const value = avg ?? 0;
  const rounded = Math.round(value * 2) / 2;
  const result: ("full" | "half" | "empty")[] = [];

  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) result.push("full");
    else if (rounded >= i - 0.5) result.push("half");
    else result.push("empty");
  }

  return result;
}

export default function TrainerDetailsPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const usernameParam = decodeURIComponent(params.username);

  const [trainer, setTrainer] = useState<TrainerDto | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<
    Record<number, TrainingPlanRatingSummary>
  >({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [trainersData, plansData] = await Promise.all([
          getTrainers(),
          getTrainingPlans(),
        ]);

        const trainersList = (trainersData || []) as TrainerDto[];

        const foundTrainer = trainersList.find(
          (t) => (t.username ?? t.Username) === usernameParam
        );

        if (!foundTrainer) {
          setError("Treneris nerastas.");
          return;
        }

        setTrainer(foundTrainer);

        const allPlans = (plansData || []) as any[];

        // 💡 filtruojam tik pagal plano username – jokio user.role
        const trainerPlans = allPlans.filter((p: any) => {
          const ownerUsername = p.username ?? p.Username;
          return ownerUsername === usernameParam;
        });

        setPlans(trainerPlans);

        // įvertinimai
        const entries = await Promise.all(
          trainerPlans.map(async (p: any) => {
            const planId = p.id ?? p.Id ?? null;
            if (!planId) return null;

            try {
              const summary = await getTrainingPlanRating(Number(planId));
              return [planId, summary] as const;
            } catch (err) {
              console.warn(
                "Nepavyko gauti trenerio plano įvertinimo, id:",
                planId,
                err
              );
              return null;
            }
          })
        );

        setRatings((prev) => {
          const next = { ...prev };
          for (const e of entries) {
            if (!e) continue;
            const [id, summary] = e;
            next[id] = summary;
          }
          return next;
        });
      } catch (err: any) {
        console.error("Klaida kraunant trenerio duomenis:", err);
        setError(err?.message || "Nepavyko užkrauti trenerio informacijos.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [usernameParam]);

  const fullName = trainer
    ? trainer.fullName ?? trainer.FullName ?? usernameParam
    : usernameParam;

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-5xl mx-auto px-4 space-y-10">
          {/* Atgal mygtukas */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trainers")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Atgal į trenerių sąrašą
            </Button>
          </div>

          {/* Antraštė */}
          <header className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                {fullName.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {fullName}
                </h1>
                <p className="text-sm text-muted-foreground">@{usernameParam}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-foreground/5 text-muted-foreground">
                Treneris
              </span>

              <span className="text-xs text-muted-foreground">
                Treniruočių planai:{" "}
                <span className="font-semibold">{plans.length}</span>
              </span>
            </motion.div>
          </header>

          {/* Statusai */}
          {loading && (
            <p className="text-center text-muted-foreground">Kraunama...</p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50/60 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && !error && plans.length === 0 && (
            <div className="text-center text-muted-foreground border border-dashed rounded-2xl py-10 px-4 bg-background/60">
              <User className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-medium mb-1">
                Šis treneris dar neturi treniruočių planų.
              </p>
              <p className="text-sm">
                Kai tik treneris sukurs viešų planų, juos galėsi matyti čia.
              </p>
            </div>
          )}

          {/* Planų kortelės */}
          {!loading && !error && plans.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                Trenerio treniruočių planai
              </h2>

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
                {plans.map((p: any, index: number) => {
                  const planId = p.id ?? p.Id;
                  if (!planId) return null;

                  const name = p.name ?? p.Name ?? "Be pavadinimo";
                  const type = p.type ?? p.Type ?? "Nežinomas tipas";
                  const durationWeeks =
                    p.durationWeeks ?? p.DurationWeeks ?? 0;

                  const imageUrl =
                    (p.imageUrl ?? p.ImageUrl)?.trim() ||
                    "/trainingPlans/defaultTrainingPlan.jpg";

                  const ratingSummary = ratings[planId];
                  const avgValue = ratingSummary?.averageScore ?? 0;
                  const stars = getAvgStars(avgValue);
                  const count = ratingSummary?.ratingsCount ?? 0;
                  const avgText = avgValue.toFixed(1);

                  const hasRating =
                    ratingSummary &&
                    ratingSummary.ratingsCount &&
                    ratingSummary.ratingsCount > 0;

                  return (
                    <motion.div
                      key={planId}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                      }}
                    >
                      <Card className="rounded-xl shadow hover:shadow-2xl transition flex flex-col h-full cursor-pointer">
                        {/* IMAGE */}
                        <div className="relative w-[90%] mx-auto mt-4 aspect-3/3 rounded-xl overflow-hidden bg-white">
                          <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(min-width: 1024px) 260px, (min-width: 768px) 33vw, 100vw"
                          />
                        </div>

                        {/* CONTENT */}
                        <CardContent className="p-4 flex flex-col gap-3 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-300">
                              Trenerio planas
                            </span>

                            <span className="text-[11px] text-muted-foreground">
                              {durationWeeks} sav.
                            </span>
                          </div>

                          <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2">
                            {name}
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            {type}
                          </p>

                          {/* Įvertinimas */}
                          <div className="flex items-center gap-1 text-sm mt-1">
                            <div className="flex items-center gap-[3px] text-[18px] leading-none">
                              {stars.map((t, idx) => {
                                if (t === "full" && hasRating) {
                                  return (
                                    <span
                                      key={idx}
                                      className="text-yellow-400"
                                    >
                                      ★
                                    </span>
                                  );
                                }
                                if (t === "half" && hasRating) {
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
                            </div>
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              {avgText} / 5 • {count}{" "}
                              {count === 1 ? "įvertinimas" : "įvertinimai"}
                            </span>
                          </div>

                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1">
                            Plano santrauka
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                Trukmė
                              </p>
                              <p className="font-semibold text-sm leading-tight">
                                {durationWeeks} sav.
                              </p>
                            </div>
                            <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                Tipas
                              </p>
                              <p className="font-semibold text-xs leading-tight">
                                {type}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/training-plans/${planId}`)
                              }
                            >
                              Žiūrėti detaliau
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </section>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}