"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import Image from "next/image";

import { getExercises, deleteExercise } from "@/lib/api";
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

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("username");
    setCurrentUser(user);

    async function load() {
      try {
        const data = await getExercises();
        setExercises(data || []);
      } catch (err) {
        console.error("Klaida kraunant pratimus:", err);
        toast.error("Nepavyko užkrauti pratimų.", {
          description: "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleDeleteConfirmed(id: number) {
    try {
      await deleteExercise(id);

      // saugiai filtruojam pagal id / Id
      setExercises((prev) => prev.filter((e) => (e.id ?? e.Id) !== id));

      toast.success("Pratimas ištrintas.", {
        description: "Pratimas buvo sėkmingai pašalintas iš sąrašo.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Nepavyko ištrinti pratimo.", {
        description: "Bandyk dar kartą arba vėliau.",
      });
    }
  }

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
                Pratimai
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-muted-foreground mt-2"
              >
                Visi Tavo sukurti pratimai.
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
                  onClick={() => (window.location.href = "/exercises/new")}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Naujas pratimas
                </Button>
              </motion.div>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <p className="text-center text-muted-foreground">Kraunama...</p>
          )}

          {/* Nėra pratimų */}
          {!loading && exercises.length === 0 && (
            <p className="text-center text-muted-foreground">
              Kol kas pratimų nėra.
            </p>
          )}

          {/* GRID */}
          {!loading && exercises.length > 0 && (
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
              {exercises.map((ex, i) => {
                const id = ex.id ?? ex.Id;
                const name = ex.name ?? ex.Name ?? "Be pavadinimo";
                const imageUrl =
                  (ex.imageUrl ?? ex.ImageUrl)?.trim() ||
                  "/exercises/custom-default.jpg";
                const sets = ex.sets ?? ex.Sets ?? 0;
                const reps = ex.reps ?? ex.Reps ?? 0;
                const weight = ex.weight ?? ex.Weight ?? 0;

                // 👇 svarbiausia vieta – savininko username su visais fallback'ais
                const ownerUsername =
                  ex.username ??
                  ex.Username ??
                  ex.user?.username ??
                  ex.User?.username ??
                  ex.user?.Username ??
                  ex.User?.Username ??
                  null;

                const isOwner =
                  !!currentUser &&
                  !!ownerUsername &&
                  currentUser.toLowerCase() ===
                    String(ownerUsername).toLowerCase();

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <Card className="rounded-xl shadow hover:shadow-2xl transition flex flex-col h-full">
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
                        <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2">
                          {name}
                        </h3>

                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Tavo nustatymai
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Serijos
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {sets}
                            </p>
                          </div>
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Pakartojimai
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {reps}
                            </p>
                          </div>
                          <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Svoris
                            </p>
                            <p className="font-semibold text-sm leading-tight">
                              {weight > 0 ? `${weight} kg` : "Kūno svoris"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              (window.location.href = `/exercises/${id}`)
                            }
                          >
                            Žiūrėti detaliau
                          </Button>

                          {/* dabar sąlyga remiasi į ownerUsername, o ne tik ex.username */}
                          {isOwner && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  (window.location.href = `/exercises/${id}/edit`)
                                }
                              >
                                ✏️ Redaguoti
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive">
                                    🗑️ Trinti
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
                                        „{name}“
                                      </span>
                                      ? Šio veiksmo atšaukti nebegalėsi.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Atšaukti
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () =>
                                        await handleDeleteConfirmed(id)
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
              })}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}