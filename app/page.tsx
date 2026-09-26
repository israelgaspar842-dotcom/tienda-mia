import { Navbar } from "@/components/landing/Navbar";
import { HeroBanner } from "@/components/landing/HeroBanner";
import { CategoriesStrip } from "@/components/landing/CategoriesStrip";
import { PortfolioGrid } from "@/components/landing/PortfolioGrid";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { Footer } from "@/components/landing/Footer";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <HeroBanner />
        <CategoriesStrip />
        <PortfolioGrid />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
