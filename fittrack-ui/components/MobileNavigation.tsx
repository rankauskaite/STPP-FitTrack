"use client";

import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";

interface MobileNavigationProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  menuItems: { name: string; href: string }[];
}

export default function MobileNavigation({ isLoggedIn, onLogout, menuItems }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`shadow-lg fixed left-0 right-0 top-16 z-40 md:hidden ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border dark:border-secondary/40">

            {/* Dynamic nav items */}
            {menuItems.map((item) => (
              <Link
                className="text-foreground hover:text-primary block px-3 py-2 font-medium"
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Auth buttons */}
            {!isLoggedIn ? (
              <div className="flex flex-col gap-2 px-3 py-2">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full font-semibold">
                    Login
                  </Button>
                </Link>

                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="px-3 py-2">
                <Button
                  variant="default"
                  className="w-full font-semibold"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}