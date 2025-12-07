"use client";

import { publicNavItems, privateNavItems } from "@/lib/constants";
import Link from "next/link";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";
import MobileNavigation from "./MobileNavigation";
import { useEffect, useState } from "react";
import { clearLocalAuth, logoutApi } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Header() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    setIsLoggedIn(!!token);
    setUsername(storedUsername);
    setRole(storedRole);
  }, []);

  // 👇 bazinis meniu pagal prisijungimą
  const baseMenuItems = isLoggedIn ? privateNavItems : publicNavItems;

  // 👇 papildomas punktas pagal rolę
  const roleSpecificItem =
    !isLoggedIn
      ? null
      : role === "Admin"
      ? { name: "Naudotojai", href: "/admin/users" }
      : role === "Trainer"
      ? { name: "Klientai", href: "/clients" }
      : { name: "Treneriai", href: "/trainers" };

  const menuItems = roleSpecificItem
    ? [...baseMenuItems, roleSpecificItem]
    : baseMenuItems;

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // jei API nepavyksta – vistiek atsijungiame lokaliai
    } finally {
      clearLocalAuth();
      setIsLoggedIn(false);
      setUsername(null);
      setRole(null);

      toast.success("Sėkmingai atsijungei", {
        description: "Lauksime sugrįžtant į FitTrack 👋",
      });

      router.push("/");
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div>
            <Link href="/">
              <h1 className="text-2xl font-black font-heading text-primary cursor-pointer hover:scale-105 transition-transform">
                FitTrack
              </h1>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-8">
              {menuItems.map((item) => (
                <Link
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-300"
                  key={item.name}
                  href={item.href}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {!isLoggedIn ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="font-semibold">
                    Prisijungti
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="font-semibold">Registruotis</Button>
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm opacity-80">{username}</span>
                <Button
                  variant="default"
                  className="font-semibold"
                  onClick={handleLogout}
                >
                  Atsijungti
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <MobileNavigation
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              menuItems={menuItems}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}