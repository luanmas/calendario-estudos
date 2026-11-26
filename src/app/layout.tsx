import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plano de Estudos",
  description: "Organize blocos de estudo e revisões espaçadas para concursos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
