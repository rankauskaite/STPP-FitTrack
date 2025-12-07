"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

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

import { getMyProfile, deleteUser, updateUser } from "@/lib/api";
import { clearLocalAuth, logoutApi } from "@/lib/auth";

type UserProfile = {
  username?: string;
  fullName?: string;
  role?: string | number;
  clients?: any[];
  // fallback jei API grąžina PascalCase
  Username?: string;
  FullName?: string;
  Role?: string | number;
  Clients?: any[];
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redagavimas (tik vardas/pavardė)
  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyProfile();
        setUser(data);
      } catch (err: any) {
        console.error("Klaida gaunant profilį:", err);
        setError(err?.message || "Nepavyko užkrauti profilio.");
        toast.error("Nepavyko užkrauti profilio.", {
          description: err?.message || "Bandyk dar kartą arba vėliau.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const username = user?.username ?? user?.Username ?? "";
  const fullName = user?.fullName ?? user?.FullName ?? username;

  const rawRole = user?.role ?? user?.Role;

  const roleLabel = useMemo(() => {
    if (rawRole === "Admin" || rawRole === 3) return "Administratorius";
    if (rawRole === "Trainer" || rawRole === "Treneris" || rawRole === 2)
      return "Treneris";
    if (rawRole === "Member" || rawRole === 1) return "Narys";
    return "Svečias";
  }, [rawRole]);

  const roleBadgeClasses = useMemo(() => {
    if (rawRole === "Admin" || rawRole === 3)
      return "bg-red-500/10 text-red-600 dark:text-red-300";
    if (rawRole === "Trainer" || rawRole === "Treneris" || rawRole === 2)
      return "bg-sky-500/10 text-sky-600 dark:text-sky-300";
    if (rawRole === "Member" || rawRole === 1)
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    return "bg-foreground/5 text-foreground/70";
  }, [rawRole]);

  const clients = useMemo(
    () => user?.clients ?? user?.Clients ?? [],
    [user]
  );

  const isTrainer =
    rawRole === "Trainer" || rawRole === "Treneris" || rawRole === 2;

  function handleStartEdit() {
    setEditMode(true);
    setEditFullName(fullName || "");
  }

  function handleCancelEdit() {
    setEditMode(false);
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username) return;

    const trimmedName = editFullName.trim();
    if (trimmedName.length < 2) {
      toast.error("Vardas per trumpas.", {
        description: "Įvesk bent 2 simbolius.",
      });
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        username,
        fullName: trimmedName,
        // slaptažodžio NEliečiam
        role: rawRole,
      };

      const updated = await updateUser(username, payload);
      setUser(updated);
      setEditMode(false);

      toast.success("Profilis atnaujintas.");
    } catch (err: any) {
      console.error("Klaida atnaujinant profilį:", err);
      toast.error("Nepavyko atnaujinti profilio.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!username) return;

    try {
      await deleteUser(username);
      toast.success("Paskyra ištrinta.", {
        description: "Tavo paskyra sėkmingai pašalinta iš sistemos.",
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");

      router.push("/login");
    } catch (err: any) {
      console.error("Klaida šalinant paskyrą:", err);
      toast.error("Nepavyko ištrinti paskyros.", {
        description: err?.message || "Bandyk dar kartą arba vėliau.",
      });
    }
  }

    async function handleLogout() {
      try {
        await logoutApi();
      } catch {
        // jei API nepavyksta – vistiek atsijungiame lokaliai
      } finally {  
        clearLocalAuth();
        toast.success("Sėkmingai atsijungei", {
          description: "Lauksime sugrįžtant į FitTrack 👋",
        });
  
        // SPA navigacija, kad toast išliktų
        router.push("/");
      }
    }

  if (loading) return <p className="pt-24 text-center">Kraunama...</p>;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!user) return <p className="pt-24 text-center">Profilis nerastas.</p>;

  // Inicialas avatarui
  const avatarInitial = (fullName || username || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <Header />

      <main className="pt-24 pb-16 bg-foreground/5 min-h-screen">
        <section className="max-w-5xl mx-auto px-4 space-y-10">
          {/* Atgal */}
          <div className="mb-2">
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

          {/* Viršutinis profilio blokas su atsijungimo ikona */}
          <Card className="rounded-3xl border bg-background shadow-md">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Kairė pusė – avataras + info */}
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="shrink-0">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-br from-primary/80 to-primary flex items-center justify-center text-3xl md:text-4xl font-bold text-primary-foreground shadow-lg">
                        {avatarInitial}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                          {fullName || username}
                        </h1>
                        <span
                          className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${roleBadgeClasses}`}
                        >
                          {roleLabel}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Prisijungęs kaip{" "}
                        <span className="font-mono font-semibold">
                          {username}
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Dešinė pusė – atsijungimo ikona */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLogout}
                    className="rounded-full"
                    title="Atsijungti"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mygtukai: redaguoti + ištrinti paskyrą */}
                <div className="flex flex-wrap items-center gap-3">
                  {!editMode && (
                    <Button
                      size="sm"
                      onClick={handleStartEdit}
                    >
                      Redaguoti profilį
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        Ištrinti paskyrą
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Ištrinti paskyrą?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Ar tikrai nori visam laikui ištrinti savo paskyrą{" "}
                          <span className="font-semibold">
                            {username}
                          </span>
                          ? Šio veiksmo atšaukti nebegalėsi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          Taip, ištrinti
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {isTrainer && (
                    <span className="text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300">
                      Treneris – turi klientų valdymo galimybes
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagrindinis blokas */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] items-start">
            {/* Kairė – paskyra (be atskiro veiksmų karto) */}
            <aside className="space-y-5">
              {/* Paskyros info / redagavimas */}
              <Card className="rounded-2xl border bg-background shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-lg">
                      Paskyros informacija
                    </h2>
                    {!editMode && (
                      <span className="text-xs text-muted-foreground">
                        Tavo pagrindiniai duomenys.
                      </span>
                    )}
                  </div>

                  {!editMode ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col gap-1 border-b border-foreground/5 pb-2">
                        <span className="text-[11px] uppercase text-muted-foreground tracking-wide">
                          Vardas, pavardė
                        </span>
                        <span className="font-medium">
                          {fullName || "Nenurodytas"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 border-b border-foreground/5 pb-2">
                        <span className="text-[11px] uppercase text-muted-foreground tracking-wide">
                          Slapyvardis
                        </span>
                        <span className="font-mono text-sm">
                          {username}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase text-muted-foreground tracking-wide">
                          Rolė
                        </span>
                        <span className="font-medium">
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSaveProfile}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="fullName">
                            Vardas, pavardė
                          </Label>
                          <Input
                            id="fullName"
                            value={editFullName}
                            onChange={(e) =>
                              setEditFullName(e.target.value)
                            }
                            placeholder="Įvesk savo vardą ir pavardę"
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Slaptažodžio keitimui reikalinga atskira
                          procedūra. Šiame lange gali redaguoti tik savo
                          vardą ir pavardę.
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          Atšaukti
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saugoma..." : "Išsaugoti"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </aside>

            {/* Dešinė – vaidmuo + klientai */}
            <div className="space-y-5">
              {/* Rolės paaiškinimas / bendras blokas */}
              <Card className="rounded-2xl border bg-background shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h2 className="font-semibold text-lg">
                    Vaidmuo sistemoje
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tavo rolė:{" "}
                    <span className="font-semibold">{roleLabel}</span>.
                  </p>

                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    {rawRole === "Admin" || rawRole === 3 ? (
                      <>
                        <li>
                          Gali valdyti vartotojus ir jų paskyras.
                        </li>
                        <li>
                          Gali matyti ir keisti visus treniruočių
                          planus.
                        </li>
                      </>
                    ) : isTrainer ? (
                      <>
                        <li>
                          Gali kurti ir valdyti savo treniruočių
                          planus.
                        </li>
                        <li>
                          Gali turėti klientų sąrašą ir jiems
                          priskirti planus.
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          Gali naudotis treniruotėmis ir treniruočių
                          planais.
                        </li>
                        <li>
                          Gali vertinti treniruotes ir planus, rašyti
                          komentarus.
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}