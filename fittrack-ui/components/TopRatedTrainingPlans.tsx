"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import { Star, Crown } from "lucide-react";
import HalfStar from "@/components/icons/HalfStar";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function TopRatedPlans() {
  const MAX_STARS = 5;

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMdUp, setIsMdUp] = useState(false); // <-- nauja

  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest("/api/trainingplans/top-rated");
        setPlans(data || []);
      } catch (e) {
        console.error("Klaida kraunant geriausius planus:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // stebim ekrano plotį – kad podiumo išdėstymą taikyti tik nuo md
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 768px)");

    const handleChange = () => {
      setIsMdUp(mq.matches);
    };

    handleChange(); // inicialus nustatymas
    mq.addEventListener("change", handleChange);

    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const top3 = plans.slice(0, 3);

  // 👇 mobilas: 0,1,2 (1→2→3); md+: 1,0,2 (2 kairėj, 1 centre, 3 dešinėj)
  const podiumOrder = isMdUp ? [1, 0, 2] : [0, 1, 2];

  return (
    <section className="py-20 bg-foreground/4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TITLE */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-black font-heading mb-4 text-foreground"
          >
            Geriausiai įvertinti treniruočių planai
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Populiariausi planai pagal vartotojų įvertinimus.
          </motion.p>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-muted-foreground">Kraunama...</p>
        )}

        {/* NO DATA */}
        {!loading && top3.length === 0 && (
          <p className="text-center text-muted-foreground">
            Dar nėra įvertintų planų.
          </p>
        )}

        {/* PODIUM – rodome iki 3, su specialiu išdėstymu */}
        {!loading && top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-end">
            {podiumOrder.map((idxInTop, visualIndex) => {
              const p = top3[idxInTop];
              if (!p) return null;

              const id = p.id ?? p.Id;
              const name = p.name ?? p.Name;
              const type = p.type ?? p.Type;
              const durationWeeks = p.durationWeeks ?? p.DurationWeeks;
              const imageUrl =
                (p.imageUrl ?? p.ImageUrl)?.trim() ||
                "/trainingPlans/defaultTrainingPlan.jpg";
              const averageRating = p.averageRating ?? p.AverageRating ?? 0;
              const ratingCount = p.ratingCount ?? p.RatingCount ?? 0;

              // 1 = pirmoji vieta, 2 = antroji, 3 = trečioji (pagal reitingą)
              const place = idxInTop + 1;

              // vertikalus offset'as – centre aukščiausiai (tik md+)
              const translateYClass =
                place === 1
                  ? "md:-translate-y-6"
                  : place === 2
                  ? "md:-translate-y-3"
                  : "md:translate-y-0";

              // podiumo aukštis
              const podiumHeightClass =
                place === 1
                  ? "h-20"
                  : place === 2
                  ? "h-16"
                  : "h-12";

              // spalvos / akcentai pagal vietą
              const podiumBgClass =
                place === 1
                  ? "bg-primary/15 border-primary/40"
                  : place === 2
                  ? "bg-muted/40 border-muted/60"
                  : "bg-muted/30 border-muted/50";

              const placeLabel =
                place === 1 ? "1 vieta" : place === 2 ? "2 vieta" : "3 vieta";

              const placeColor =
                place === 1
                  ? "text-yellow-400"
                  : place === 2
                  ? "text-slate-300 dark:text-slate-200"
                  : "text-amber-700 dark:text-amber-300";

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                    delay: visualIndex * 0.15,
                  }}
                  className={`flex flex-col items-center ${translateYClass} transition-transform duration-300`}
                >
                  {/* vietos badge + karūna pirmam */}
                  <div className="mb-3 flex items-center gap-2">
                    {place === 1 && (
                      <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm" />
                    )}
                    <span
                      className={`text-sm font-semibold uppercase tracking-wide ${placeColor}`}
                    >
                      {placeLabel}
                    </span>
                  </div>

                  {/* CARD */}
                  <Card
                    className="w-full hover:shadow-2xl transition-shadow duration-300 cursor-pointer relative"
                    onClick={() => router.push(`/training-plans/${id}`)}
                  >
                    {/* subtilus gradientinis fonas už pirmos vietos */}
                    {place === 1 && (
                      <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-b from-primary/10 via-transparent to-transparent" />
                    )}

                    <CardContent className="relative p-8 text-center">
                      {/* IMAGE */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                          delay: visualIndex * 0.15,
                        }}
                        className="relative mb-6 w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden shadow-md"
                      >
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          className="object-cover border-4 border-primary/20 group-hover:border-primary transition-colors duration-300 rounded-full"
                        />
                      </motion.div>

                      {/* STARS */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: visualIndex * 0.2,
                        }}
                        className="flex justify-center mb-3 gap-1"
                      >
                        {Array.from({ length: MAX_STARS }).map((_, i) => {
                          const rating = averageRating;
                          const full = i + 1 <= Math.floor(rating);
                          const half = !full && i < rating && rating < i + 1;

                          if (full) {
                            return (
                              <Star
                                key={i}
                                className="w-5 h-5 text-yellow-300"
                                fill="currentColor"
                              />
                            );
                          }

                          if (half) {
                            return (
                              <HalfStar
                                key={i}
                                className="w-5 h-5 text-yellow-300"
                              />
                            );
                          }

                          return (
                            <Star
                              key={i}
                              className="w-5 h-5 text-neutral-300"
                              fill="none"
                            />
                          );
                        })}
                      </motion.div>

                      {/* TITLE */}
                      <motion.h3
                        className="text-lg md:text-xl font-bold font-heading text-foreground mb-1"
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: visualIndex * 0.2,
                        }}
                      >
                        {name}
                      </motion.h3>

                      {/* DETAILS */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: visualIndex * 0.23,
                        }}
                        className="text-muted-foreground leading-relaxed text-sm mb-1"
                      >
                        Tipas: {type}
                      </motion.p>

                      <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: visualIndex * 0.25,
                        }}
                        className="text-muted-foreground leading-relaxed text-sm mb-3"
                      >
                        Trukmė: {durationWeeks} savaitės
                      </motion.p>

                      {/* FOOTER */}
                      <motion.cite
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: visualIndex * 0.28,
                        }}
                        className="font-semibold text-primary italic block text-sm"
                      >
                        {averageRating} / 5 · {ratingCount} įvertinimai
                      </motion.cite>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/training-plans/${id}`);
                        }}
                      >
                        Peržiūrėti planą
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}