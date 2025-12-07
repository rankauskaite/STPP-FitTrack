"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getTrainers, getTrainingPlans } from "@/lib/api";
import { User, Users, ArrowRight } from "lucide-react";

type TrainerDto = any;

type TrainerWithPlans = {
  username: string;
  fullName: string;
  role: string;
  plans: any[];
};

export default function TrainersPage() {
  const router = useRouter();

  const [trainers, setTrainers] = useState<TrainerWithPlans[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [trainersData, plansData] = await Promise.all([
          getTrainers(),
          getTrainingPlans(),
        ]);

        const trainersRaw = (trainersData || []) as TrainerDto[];
        const plans = (plansData || []) as any[];

        // username -> trenerio info + jo planai
        const map = new Map<string, TrainerWithPlans>();

        // 1) sudedam visus trenerius
        for (const t of trainersRaw) {
          const username = t.username ?? t.Username;
          if (!username) continue;

          const fullName = t.fullName ?? t.FullName ?? username;
          const role = t.role ?? t.Role ?? "Trainer";

          map.set(username, {
            username,
            fullName,
            role,
            plans: [],
          });
        }

        // 2) prie trenerių prikabinam planus pagal username
        for (const p of plans) {
          const ownerUsername = p.username ?? p.Username;
          if (!ownerUsername) continue;

          const trainer = map.get(ownerUsername);
          if (!trainer) {
            // planas priklauso ne treneriui (arba trenerio dar nėra sąraše) – praleidžiam
            continue;
          }

          trainer.plans.push(p);
        }

        const list = Array.from(map.values()).sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );

        setTrainers(list);
      } catch (err: any) {
        console.error("Klaida kraunant trenerius:", err);
        setError(err?.message || "Nepavyko užkrauti trenerių.");
        toast.error("Nepavyko užkrauti trenerių.", {
          description: err?.message,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-6xl mx-auto px-4 space-y-10">
          {/* Atgal mygtukas */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-primary"
            >
              <span className="text-lg">←</span>
              Atgal į pradžią
            </Button>
          </div>

          {/* Antraštė */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3"
              >
                <Users className="w-7 h-7 text-primary" />
                Treneriai
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-1 text-muted-foreground max-w-2xl"
              >
                Peržiūrėk FitTrack trenerius ir jų sukurtus treniruočių planus.
              </motion.p>
            </div>
          </header>

          {/* Klaida */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50/60 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Kraunama */}
          {loading && (
            <p className="text-center text-muted-foreground">Kraunama...</p>
          )}

          {/* Nėra trenerių */}
          {!loading && !error && trainers.length === 0 && (
            <div className="text-center text-muted-foreground border border-dashed rounded-2xl py-12 px-4 bg-background/60">
              <User className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-medium mb-1">Kol kas trenerių nerasta.</p>
              <p className="text-sm">
                Kai treneriai sukurs planų, jie atsiras šiame sąraše.
              </p>
            </div>
          )}

          {/* Trenerių grid */}
          {!loading && !error && trainers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Treneriai ({trainers.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((t, index) => {
                  const username = t.username;
                  const fullName = t.fullName || username;
                  const planCount = t.plans.length;

                  return (
                    <motion.div
                      key={username}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                        delay: index * 0.05,
                      }}
                    >
                      <Card className="h-full flex flex-col border border-border/70 bg-background/90 hover:shadow-lg transition-shadow">
                        <CardContent className="p-5 flex flex-col h-full">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                  {fullName.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <p className="font-semibold leading-tight">
                                    {fullName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    @{username}
                                  </p>
                                </div>
                              </div>

                              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-foreground/5 text-muted-foreground">
                                Treneris
                              </span>
                            </div>
                          </div>

                          {/* Santrauka + perėjimas į trenerio puslapį */}
                          <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                            <p className="text-xs text-muted-foreground">
                              Planų skaičius:{" "}
                              <span className="font-semibold">
                                {planCount}
                              </span>
                            </p>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                              onClick={() =>
                                router.push(
                                  `/trainers/${encodeURIComponent(username)}`
                                )
                              }
                            >
                              Peržiūrėti trenerio planus
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}