"use client";

import * as motion from "motion/react-client";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <section className="h-screen relative flex items-center justify-center overflow-hidden pt-16">
      
      {/* Background image + overlay */}
      <div className="absolute inset-0">
        <Image
          src="/fit-heroes.jpg"
          alt="Fitness Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-white text-center px-4 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="text-5xl md:text-7xl font-black font-heading mb-6 leading-tighter"
        >
          Pasiek savo tikslus{" "}
          <br />
          <span className="text-primary">su FitTrack</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-xl md:text-2xl mb-8 font-light leading-relaxed max-w-3xl mx-auto"
        >
          Individualūs treniruočių planai, pažangos stebėjimas ir motyvacija —
          viskas vienoje vietoje.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >

          {/* === NEPRISIJUNGĘS === */}
          {!isLoggedIn ? (
            <>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg font-semibold transition-transform duration-300 hover:scale-105 px-8"
                >
                  Sukurti paskyrą
                </Button>
              </Link>

              <Link href="/workouts">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-lg font-semibold transition-transform duration-300 hover:scale-105 px-8"
                >
                  Treniruotės
                </Button>
              </Link>
            </>
          ) : (
            <>
              {/* === PRISIJUNGĘS === */}
              <Link href="/workouts">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg font-semibold transition-transform duration-300 hover:scale-105 px-8"
                >
                  Treniruotės
                </Button>
              </Link>

              <Link href="/training-plans">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-lg font-semibold transition-transform duration-300 hover:scale-105 px-8"
                >
                  Treniruočių planai
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}