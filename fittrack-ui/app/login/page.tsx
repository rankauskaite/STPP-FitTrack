"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({ username: "", password: "" });

    // Frontend validacija
    let valid = true;
    const validation: any = {};

    if (!username.trim()) {
      validation.username = "Vartotojo vardas privalomas.";
      valid = false;
    }
    if (!password.trim()) {
      validation.password = "Slaptažodis privalomas.";
      valid = false;
    }

    setFieldErrors(validation);
    if (!valid) return;

    try {
      await login(username, password);

      // ČIA – gražus sėkmės pranešimas
      toast.success("Prisijungimas sėkmingas!", {
        description: `Sveikas sugrįžęs, ${username}.`,
      });

      // SPA navigacija – be pilno reload
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Prisijungti nepavyko.");
      toast.error("Prisijungti nepavyko", {
        description: err.message || "Bandyk dar kartą.",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background/dark">
      {/* PROGRAMOS LOGO */}
      <div className="pt-20 text-center">
        <h1 className="text-5xl font-black text-primary">FitTrack</h1>
      </div>

      {/* CENTRINIS BLOKAS */}
      <div className="flex flex-col justify-center items-center flex-1 px-4 gap-3">
        {/* ATGAL MYGTUKAS */}
        <div className="w-full max-w-md flex justify-start">
          <Link
            href="/"
            className="flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Atgal į pradžią
          </Link>
        </div>

        {/* KORTELĖ */}
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">Prisijungimas</h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* USERNAME */}
              <div>
                <input
                  className={`w-full px-3 py-2 border rounded-md bg-background ${
                    fieldErrors.username ? "border-red-500" : ""
                  }`}
                  placeholder="Vartotojo vardas"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                {fieldErrors.username && (
                  <p className="text-red-600 text-sm mt-1">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <input
                  className={`w-full px-3 py-2 border rounded-md bg-background pr-10 ${
                    fieldErrors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Slaptažodis"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <p className="text-red-600 text-sm">{fieldErrors.password}</p>
              )}

              {/* API GLOBALI KLAIDA */}
              {error && (
                <p className="text-red-600 text-center mb-3 font-semibold">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full font-semibold text-base">
                Prisijungti
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col text-center gap-2">
            <p className="text-sm text-muted-foreground">Neturi paskyros?</p>
            <Link href="/signup">
              <Button variant="outline" className="w-full font-semibold">
                Sukurti paskyrą
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* FOOTER */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FitTrack. Visos teisės saugomos.
      </footer>
    </div>
  );
}