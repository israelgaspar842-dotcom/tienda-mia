import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { PortfolioGrid } from "@/components/landing/PortfolioGrid";
import { Features } from "@/components/landing/Features";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { Footer } from "@/components/landing/Footer";
import { EducationalSection } from "@/components/landing/EducationalSection";
import { ModalExplorador } from "@/components/ui/ModalExplorador";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col">
        <Hero />
        <ModalExplorador />
        <PortfolioGrid />
        <EducationalSection />
        <Features />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
