import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Configuración de fuentes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadatos del sitio
export const metadata: Metadata = {
  title: "CarCare Tracker",
  description: "Gestion de Flota de mano de CarCare Tracker para la Organización y Sostenibilidad de la flota de coches de una empresa",
  icons: {
    icon: "/favicon.ico", // Ruta explícita al archivo en /public
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
