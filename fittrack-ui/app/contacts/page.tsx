// app/kontaktai/page.tsx
"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function ContactPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Užpildyk visus laukus.");
      return;
    }

    try {
      setSending(true);

      // Čia vėliau galėsi prijungti tikrą API (pvz. el. laiškų siuntimui)
      await new Promise((res) => setTimeout(res, 600));

      setName("");
      setEmail("");
      setMessage("");

      toast.success("Žinutė išsiųsta 🎉", {
        description: "Atsakysime, kai tik galėsime.",
      });
    } catch (err: any) {
      console.error("Klaida siunčiant žinutę:", err);
      toast.error("Nepavyko išsiųsti žinutės.", {
        description: "Bandyk dar kartą arba susisiek el. paštu.",
      });
    } finally {
      setSending(false);
    }
  }

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

          {/* Antraštė */}
          <header className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Kontaktai
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Jei turi idėjų, pastebėjimų ar susidūrei su nesklandumais – parašyk mums.
              FitTrack kuriame tam, kad tau būtų patogiau sportuoti ir sekti progresą.
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] items-start">
            {/* Kairė – kontaktinė info */}
            <div className="space-y-5">
              <Card className="rounded-2xl border bg-background shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-semibold text-lg">Susisiek</h2>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-3 items-start">
                      <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">El. paštas</p>
                        <p>info@fittrack.lt</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <Phone className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Telefonas</p>
                        <p>+370 600 00000</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Adresas</p>
                        <p>Vilnius, Lietuva</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <Clock className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Atsakymo laikas</p>
                        <p>Paprastai atsakome per 1–2 darbo dienas.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-background shadow-sm">
                <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Turi idėjų, kaip patobulinti FitTrack?
                  </p>
                  <p>
                    Parašyk, kokios funkcijos tau labiausiai trūksta, arba
                    papasakok, kaip naudoji sistemą savo kasdienybėje.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dešinė – kontaktinė forma */}
            <Card className="rounded-2xl border bg-background shadow-sm">
              <CardContent className="p-6 md:p-7">
                <h2 className="font-semibold text-lg mb-4">
                  Parašyk mums žinutę
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Vardas
                    </label>
                    <input
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm border-input"
                      placeholder="Įrašyk savo vardą"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      El. paštas
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm border-input"
                      placeholder="tavo@pastas.lt"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Žinutė
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm border-input min-h-[120px] resize-y"
                      placeholder="Parašyk, kuo galime padėti..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={sending} className="gap-2">
                      {sending ? (
                        "Siunčiama..."
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Siųsti žinutę
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}