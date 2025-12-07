"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMyClients } from "@/lib/api";
import { User, Users, ArrowRight } from "lucide-react";

type UserDto = any;

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyClients(); // Admin atveju grąžina visus naudotojus
      setUsers(data || []);
    } catch (err: any) {
      console.error("Klaida kraunant naudotojus:", err);
      setError(err?.message || "Nepavyko užkrauti naudotojų.");
      toast.error("Nepavyko užkrauti naudotojų.", {
        description: err?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
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
                Naudotojai
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-1 text-muted-foreground max-w-2xl"
              >
                Administratoriaus peržiūros puslapis – visi sistemos naudotojai
                ir jų treniruočių planai.
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

          {/* Nėra naudotojų */}
          {!loading && !error && users.length === 0 && (
            <div className="text-center text-muted-foreground border border-dashed rounded-2xl py-12 px-4 bg-background/60">
              <User className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-medium mb-1">Naudotojų nerasta.</p>
              <p className="text-sm">
                Puslapis rodo visus sistemoje registruotus naudotojus.
              </p>
            </div>
          )}

          {/* Naudotojų grid */}
          {!loading && !error && users.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Naudotojai ({users.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u: UserDto, index: number) => {
                  const username = u.username ?? u.Username;
                  const fullName = u.fullName ?? u.FullName ?? username;
                  const role = u.role ?? u.Role ?? "";
                  const trainingPlans =
                    (u.trainingPlans ?? u.TrainingPlans ?? []) as any[];

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
                                {role === "Trainer"
                                  ? "Treneris"
                                  : role === "Admin"
                                  ? "Administratorius"
                                  : "Naudotojas"}
                              </span>
                            </div>
                          </div>

                          {/* Santrauka + nuėjimas į naudotojo puslapį */}
                          <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                            <p className="text-xs text-muted-foreground">
                              Planų skaičius:{" "}
                              <span className="font-semibold">
                                {trainingPlans.length}
                              </span>
                            </p>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                              onClick={() =>
                                router.push(
                                  `/admin/users/${encodeURIComponent(username)}`
                                )
                              }
                            >
                              Peržiūrėti naudotoją
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