"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({ fullName: "", username: "", password: "" });

    // --- FRONTEND VALIDACIJA ---
    let valid = true;
    const validation: any = {};

    if (!fullName.trim()) {
      validation.fullName = "Vardas ir pavardė privalomi.";
      valid = false;
    }
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
      await signup(fullName, username, password);

      // ✅ SĖKMINGA REGISTRACIJA – gražus toast
      toast.success("Registracija sėkminga!", {
        description: `Sveikas prisijungęs, ${username}.`,
      });

      // Kadangi signup jau išsaugo access/refresh tokenus – vartotojas iškart prisijungęs
      router.push("/");
    } catch (err: any) {
      const msg = err?.message || "Registracija nepavyko.";
      setError(msg);

      toast.error("Registracija nepavyko", {
        description: msg,
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
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

        {/* REGISTRACIJOS KORTELĖ */}
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">Sukurti paskyrą</h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* FULL NAME */}
              <div>
                <input
                  className={`w-full px-3 py-2 border rounded-md bg-background ${
                    fieldErrors.fullName ? "border-red-500" : ""
                  }`}
                  placeholder="Vardas ir pavardė"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                {fieldErrors.fullName && (
                  <p className="text-red-600 text-sm mt-1">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

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
              <div>
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
                  <p className="text-red-600 text-sm mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* GLOBALI API KLAIDA (be toast, bet papildomai formoje) */}
              {error && (
                <p className="text-red-600 text-center font-semibold">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full font-semibold text-base">
                Sukurti paskyrą
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col text-center gap-2">
            <p className="text-sm text-muted-foreground">Jau turi paskyrą?</p>
            <Link href="/login">
              <Button variant="outline" className="w-full font-semibold">
                Prisijungti
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