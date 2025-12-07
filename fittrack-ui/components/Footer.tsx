import { Facebook, Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import { publicNavItems } from "@/lib/constants";

export default function Footer() {
  const footerLinks = [
    ...publicNavItems,
    { name: "Apie mus", href: "/about" },
    { name: "Kontaktai", href: "/contacts" },
  ];

  return (
    <footer className="bg-secondary dark:bg-secondary/20 text-neutral-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-3xl font-black font-heading text-primary mb-4">
              FitTrack
            </h3>

            <p className="mb-6 leading-relaxed max-w-md">
              Asmeninė sveikatingumo platforma, padedanti siekti tikslų,
              stebėti progresą ir treniruotis pagal profesionalius planus.
            </p>

            <div className="flex space-x-4">
              <Link
                href="/"
                className="w-10 h-10 bg-secondary/40 rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="w-10 h-10 bg-secondary/40 rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Youtube className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="w-10 h-10 bg-secondary/40 rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Facebook className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Dynamic Links */}
          <div>
            <h4 className="text-lg font-bold font-heading mb-4">Meniu</h4>

            <ul className="space-y-2">
              {footerLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-secondary/40 pt-20 text-center text-neutral-400">
          <p>© {new Date().getFullYear()} FitTrack. Visos teisės saugomos.</p>
        </div>
      </div>
    </footer>
  );
}