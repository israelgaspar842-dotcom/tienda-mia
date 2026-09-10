import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://inventov3d.vercel.app"),
  title: "INVENTOV — Impresión 3D",
  description: "Impresión 3D bajo demanda. Desde prototipos hasta series cortas.",
  openGraph: {
    title: "INVENTOV — Impresión 3D y Prototipado",
    description: "Materializa tus ideas con nuestro servicio de manufactura y diseño CAD.",
    url: "https://inventov3d.vercel.app",
    siteName: "INVENTOV",
    images: [
      {
        url: "/imagenes/logo-social.jpg",
        width: 1024,
        height: 1024,
        alt: "INVENTOV Impresión 3D Logo",
      },
    ],
    locale: "es_BO",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-[#F5F4F1] text-slate-900 dark:bg-zinc-950 dark:text-slate-100 antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ToasterProvider>{children}</ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
