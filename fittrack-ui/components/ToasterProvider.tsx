"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        // kiek laiko rodom pranešimą (ms)
        duration: 3000,

        // bendras klasės stilius visiems toastams
        className: "font-semibold",

        // SPECIFIŠKAI success'ui – naudoja Tavo --primary spalvą
        classNames: {
          success: "bg-primary text-primary-foreground border-none",
        },
      }}
    />
  );
}