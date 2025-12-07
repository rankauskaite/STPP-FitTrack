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

import { getMyClients, getTrainingPlanRating } from "@/lib/api";

type UserDto = any;

type TrainingPlanRatingSummary = {
  averageScore: number | null;
  ratingsCount: number;
  userScore: number | null;
};

// Pusinė žvaigždutė – tokia pati kaip TrainingPlansPage
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

export default function AdminUserDetailsPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const usernameParam = decodeURIComponent(params.username);

  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // planId -> rating
  const [ratings, setRatings] = useState<
    Record<number, TrainingPlanRatingSummary>
  >({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Admin atveju getMyClients() grąžina VISUS naudotojus + jų TrainingPlans
        const data = await getMyClients();
        const list = (data || []) as UserDto[];

        const found = list.find(
          (u) => (u.username ?? u.Username) === usernameParam
        );

        if (!found) {
          setError("Naudotojas nerastas.");
          return;
        }

        setUser(found);

        const trainingPlans =
          (found.trainingPlans ?? found.TrainingPlans ?? []) as any[];

        // Iš karto parsikraunam įvertinimus kiekvienam plano Id
        const entries = await Promise.all(
          trainingPlans.map(async (p: any) => {
            const planId: number | null =
              p.id ??
              p.Id ??
              p.trainingPlanId ??
              p.TrainingPlanId ??
              null;

            if (!planId) return null;

            try {
              const summary = await getTrainingPlanRating(Number(planId));
              return [planId, summary] as const;
            } catch (err) {
              console.warn(
                "Nepavyko gauti naudotojo plano įvertinimo, id:",
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
        console.error("Klaida kraunant naudotojo duomenis:", err);
        setError(err?.message || "Nepavyko užkrauti naudotojo informacijos.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [usernameParam]);

  const trainingPlans =
    (user?.trainingPlans ?? user?.TrainingPlans ?? []) as any[];

  const fullName = user
    ? user.fullName ?? user.FullName ?? usernameParam
    : usernameParam;
  const role = user?.role ?? user?.Role ?? "";

  // badge tekstas planų kortelėms pagal rolę
  const planBadgeText =
    role === "Trainer"
      ? "Trenerio planas"
      : role === "Admin"
      ? "Administratoriaus planas"
      : "Naudotojo planas";

  const planBadgeClass =
    role === "Trainer"
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
      : role === "Admin"
      ? "bg-purple-500/10 text-purple-600 dark:text-purple-300"
      : "bg-foreground/5 text-muted-foreground";

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
              onClick={() => router.push("/admin/users")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Atgal į naudotojų sąrašą
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
                {role === "Trainer"
                  ? "Treneris"
                  : role === "Admin"
                  ? "Administratorius"
                  : "Naudotojas"}
              </span>

              <span className="text-xs text-muted-foreground">
                Treniruotės planai:{" "}
                <span className="font-semibold">{trainingPlans.length}</span>
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

          {!loading && !error && trainingPlans.length === 0 && (
            <div className="text-center text-muted-foreground border border-dashed rounded-2xl py-10 px-4 bg-background/60">
              <User className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-medium mb-1">
                Šis naudotojas dar neturi treniruočių planų.
              </p>
            </div>
          )}

          {/* Planų kortelės – stilius kaip trenerių/planų puslapiuose */}
          {!loading && !error && trainingPlans.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                Naudotojo treniruočių planai
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
                {trainingPlans.map((p: any, index: number) => {
                  const planId: number | null =
                    p.id ?? p.Id ?? p.trainingPlanId ?? p.TrainingPlanId ?? null;
                  if (!planId) {
                    console.warn("Naudotojo plano ID nerastas", p);
                    return null;
                  }

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
                          {/* Badge eilutė */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " +
                                planBadgeClass
                              }
                            >
                              {planBadgeText}
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

                          {/* Įvertinimas – rodom visada, net jei 0/5 */}
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