"use client";

import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getMyClients,
  addClientToTrainer,
  removeClientFromTrainer,
  searchClients,
} from "@/lib/api";
import {
  User,
  Users,
  UserPlus,
  UserMinus,
  ArrowRight,
  Loader2,
} from "lucide-react";

type ClientDto = any; // naudosim saugiai su ??, kad veiktų ir camelCase, ir PascalCase
type SearchUserDto = {
  username: string;
  fullName?: string | null;
  role?: string;
};

export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newClientUsername, setNewClientUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingUsername, setRemovingUsername] = useState<string | null>(null);

  // paieškos pasiūlymai
  const [searchResults, setSearchResults] = useState<SearchUserDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function loadClients() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyClients();
      setClients(data || []);
    } catch (err: any) {
      console.error("Klaida kraunant klientus:", err);
      setError(err?.message || "Nepavyko užkrauti klientų.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  // 🔎 Autocomplete paieška pagal įvestą dalį slapyvardžio
  useEffect(() => {
    const query = newClientUsername.trim();

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await searchClients(query);
        if (!cancelled) {
          setSearchResults(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Klaida ieškant klientų:", err);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300); // paprastas debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [newClientUsername]);

  // bendras pridėjimas pagal username (naudojam ir iš formos, ir iš pasiūlymų)
  async function addClient(username: string) {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Įvesk kliento slapyvardį.");
      return;
    }

    // jeigu jau yra klientas – nekartojam
    const alreadyClient = clients.some(
      (c) => (c.username ?? c.Username) === trimmed
    );
    if (alreadyClient) {
      toast.info("Šis naudotojas jau yra tavo klientas.");
      return;
    }

    try {
      setIsAdding(true);
      await addClientToTrainer(trimmed);
      toast.success("Klientas pridėtas sėkmingai.");
      setNewClientUsername("");
      setSearchResults([]);
      await loadClients();
    } catch (err: any) {
      console.error("Klaida pridedant klientą:", err);
      toast.error("Nepavyko pridėti kliento.", {
        description: err?.message,
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    await addClient(newClientUsername);
  }

  async function handleRemoveClient(username: string) {
    try {
      setRemovingUsername(username);
      await removeClientFromTrainer(username);
      toast.success("Klientas pašalintas.");
      await loadClients();
    } catch (err: any) {
      console.error("Klaida šalinant klientą:", err);
      toast.error("Nepavyko pašalinti kliento.", {
        description: err?.message,
      });
    } finally {
      setRemovingUsername(null);
    }
  }

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
                Mano klientai
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-1 text-muted-foreground max-w-2xl"
              >
                Valdyk savo klientus, peržiūrėk jų treniruočių planus ir
                lengvai pereik į planų detales.
              </motion.p>
            </div>
          </header>

          {/* Pridėjimo forma + autocomplete pasiūlymai */}
          <section className="rounded-2xl border bg-background shadow-sm p-5 md:p-6 space-y-3">
            <form
              onSubmit={handleAddClient}
              className="flex flex-col md:flex-row gap-3 md:items-end"
            >
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Pridėti naują klientą
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm border-input"
                  placeholder="Įvesk bent 2 simbolius kliento slapyvardžio"
                  value={newClientUsername}
                  onChange={(e) => setNewClientUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Klientas turi būti užsiregistravęs FitTrack, kad jį būtų
                  galima priskirti.
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full md:w-auto font-semibold flex items-center gap-2"
                  disabled={isAdding}
                >
                  <UserPlus className="w-4 h-4" />
                  {isAdding ? "Pridedama..." : "Pridėti pagal įvestą slapyvardį"}
                </Button>
              </div>
            </form>

            {/* Pasiūlymų sąrašas */}
            {newClientUsername.trim().length >= 2 && (
              <div className="mt-1 rounded-xl border bg-foreground/5 max-h-64 overflow-y-auto">
                {isSearching && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Ieškoma naudotojų...
                  </div>
                )}

                {!isSearching && searchResults.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Pagal įvestą tekstą naudotojų nerasta.
                  </p>
                )}

                {!isSearching &&
                  searchResults.length > 0 &&
                  searchResults.map((u) => {
                    const username = u.username;
                    const fullName = u.fullName || u.username;
                    const alreadyClient = clients.some(
                      (c) => (c.username ?? c.Username) === username
                    );

                    return (
                      <div
                        key={username}
                        className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {fullName.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {fullName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              @{username}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          disabled={isAdding || alreadyClient}
                          onClick={() => addClient(username)}
                        >
                          {alreadyClient ? "Jau klientas" : "Pridėti"}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Klaida */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50/60 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <p className="text-center text-muted-foreground">Kraunama...</p>
          )}

          {/* Nėra klientų */}
          {!loading && !error && clients.length === 0 && (
            <div className="text-center text-muted-foreground border border-dashed rounded-2xl py-12 px-4 bg-background/60">
              <User className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-medium mb-1">Kol kas neturi priskirtų klientų.</p>
              <p className="text-sm">
                Pridėk klientą įvesdamas jo slapyvardį viršuje.
              </p>
            </div>
          )}

          {/* Klientų grid – čia tik klientai, be planų sąrašo */}
          {!loading && !error && clients.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Klientai ({clients.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((c: ClientDto, index: number) => {
                  const username = c.username ?? c.Username;
                  const fullName = c.fullName ?? c.FullName ?? username;
                  const role = c.role ?? c.Role ?? "";
                  const trainingPlans =
                    (c.trainingPlans ?? c.TrainingPlans ?? []) as any[];

                  const isRemoving = removingUsername === username;

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
                                  : "Klientas"}
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveClient(username)}
                              disabled={isRemoving}
                              title="Pašalinti klientą"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Santrauka + nuėjimas į kliento puslapį */}
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
                                router.push(`/clients/${encodeURIComponent(username)}`)
                              }
                            >
                              Peržiūrėti kliento planus
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