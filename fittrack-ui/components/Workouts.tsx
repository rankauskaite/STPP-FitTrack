"use client";

import { useEffect, useRef, useState } from "react";
import * as motion from "motion/react-client";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import { Button } from "./ui/button";
import { getWorkouts } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation"; // ⬅️ PRIDĖTA

export default function WorkoutsSlider() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // ⬅️ PRIDĖTA

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error("Klaida kraunant treniruotes:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scrollOneCard = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const card = scrollRef.current.querySelector(".slider-card") as HTMLElement;
    if (!card) return;

    const gap = 24; // gap-6 = 24px
    const cardWidth = card.offsetWidth + gap;

    scrollRef.current.scrollTo({
      left:
        direction === "left"
          ? scrollRef.current.scrollLeft - cardWidth
          : scrollRef.current.scrollLeft + cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 bg-foreground/4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black font-heading mb-4"
          >
            Trenerių treniruotės
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Peržiūrėk viešai prieinamas trenerių treniruotes.
          </motion.p>
        </div>

        {loading && <p className="text-center">Kraunama...</p>}

        {/* SLIDER */}
        <div className="relative">
          {/* LEFT ARROW */}
          <button
            onClick={() => scrollOneCard("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 
                       bg-white/90 dark:bg-black/70 p-3 rounded-full shadow-lg
                       hover:bg-primary hover:text-white transition z-20"
          >
            <ChevronLeft size={26} />
          </button>

          {/* SCROLL AREA */}
          <motion.div
            ref={scrollRef}
            className="
              flex gap-6 overflow-x-scroll scroll-smooth px-1
              snap-x snap-mandatory no-scrollbar
            "
          >
            {workouts.map((workout, i) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="
                  slider-card
                  shrink-0
                  snap-start
                  w-[85%] sm:w-[60%] md:w-[45%] lg:w-[30%]
                "
              >
                <Card className="rounded-xl shadow hover:shadow-2xl transition">
                  <div className="relative w-[90%] mx-auto h-48 rounded-xl overflow-hidden">
                    <Image
                      src={workout.imageUrl || "/workout/defaultWorkout.jpg"}
                      fill
                      alt={workout.type ?? "Treniruotė"}
                      className="object-cover"
                    />
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold">{workout.name}</h3>

                    <p className="mt-2 text-muted-foreground">
                      Data:{" "}
                      {workout.date
                        ? new Date(workout.date).toLocaleDateString("lt-LT")
                        : "-"}
                      <br />
                      Trukmė: {workout.durationMinutes} min
                      <br />
                      Kalorijų: {workout.caloriesBurned}
                    </p>

                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={() => router.push(`/workouts/${workout.id}`)} // ⬅️ PRIDĖTA
                    >
                      Žiūrėti detaliau
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* RIGHT ARROW */}
          <button
            onClick={() => scrollOneCard("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2
                       bg-white/90 dark:bg-black/70 p-3 rounded-full shadow-lg
                       hover:bg-primary hover:text-white transition z-20"
          >
            <ChevronRight size={26} />
          </button>
        </div>
      </div>
    </section>
  );
}