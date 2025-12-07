// app/apie-mus/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  HeartPulse,
  Users,
  Sparkles,
  Target,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  const router = useRouter();

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-5xl mx-auto px-4 space-y-10">
          {/* Atgal mygtukas */}
          <div>
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

          {/* Hero blokas */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Apie FitTrack
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tavo asmeninis kelias į sveikesnį gyvenimą
            </h1>

            <p className="text-muted-foreground max-w-2xl">
              FitTrack padeda susidėlioti treniruotes, stebėti progresą ir
              lengviau pasiekti savo tikslus – nesvarbu, ar sportuoji salėje,
              namuose, ar lauke. Mūsų tikslas – supaprastinti viską, kas vyksta
              tarp „noriu pradėti“ ir „aš tai padariau“.
            </p>
          </header>

          {/* Punktai apie misiją / viziją */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-2xl border bg-background shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-semibold text-lg">Mūsų misija</h2>
                <p className="text-sm text-muted-foreground">
                  Padėti žmonėms sistemingai siekti savo tikslų – nuo pirmųjų
                  žingsnių sporte iki ilgalaikio, tvaraus progreso.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-background shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h2 className="font-semibold text-lg">Sveikas balansas</h2>
                <p className="text-sm text-muted-foreground">
                  FitTrack skatina ne tik treniruotes, bet ir poilsį,
                  savijautą, rutiną – kad sportas taptų natūralia gyvenimo
                  dalimi, o ne dar viena prievole.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-background shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                </div>
                <h2 className="font-semibold text-lg">Bendruomenė</h2>
                <p className="text-sm text-muted-foreground">
                  Treneriai, nariai ir planai vienoje vietoje – kad būtų lengva
                  dalintis, sekti progresą ir motyvuoti vieniems kitus.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Kaip veikia FitTrack */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] items-start">
            <Card className="rounded-2xl border bg-background shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Kaip FitTrack padeda tau
                </h2>

                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">
                        Treniruotės ir planai vienoje vietoje.
                      </span>{" "}
                      Galėsi kurti, koreguoti ir išsaugoti treniruotes bei
                      treniruočių planus.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">
                        Treneriai ir jų klientai.
                      </span>{" "}
                      Treneriai gali valdyti savo klientų planus, o nariai –
                      lengvai sekti paskirtas treniruotes.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">
                        Įvertinimai ir atsiliepimai.
                      </span>{" "}
                      Vertink treniruotes, palik komentarus ir atrask labiausiai
                      tau tinkančius planus.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">
                        Aiški struktūra.
                      </span>{" "}
                      Kiekvienas planas turi trukmę, tipą, priskirtas
                      treniruotes – viskas tvarkingai ir aiškiai.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-background shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">
                  Kam skirtas FitTrack?
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">
                      Nariams
                    </span>{" "}
                    – kurie nori turėti aiškų planą, sekti progresą ir
                    matyti savo pasiekimus.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Treneriams
                    </span>{" "}
                    – kurie nori patogiai kurti planus, juos priskirti
                    klientams ir matyti grįžtamąjį ryšį.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Administratoriams
                    </span>{" "}
                    – kurie prižiūri sistemą, valdo vartotojus ir turinį.
                  </p>
                </div>

                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push("/training-plans")}
                >
                  Peržiūrėti treniruočių planus
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}