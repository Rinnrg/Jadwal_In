import Hero from "@/components/hero";
import About from "@/src/components/landing/about";
import Features from "@/src/components/landing/features";
import HowItWorks from "@/src/components/landing/how-it-works";
import Benefits from "@/src/components/landing/benefits";
import Testimonials from "@/components/testimonials";
import Faq from "@/components/faq";
import Technology from "@/src/components/landing/technology";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-dvh">
      <NavBar />
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Faq />
      <Technology />
      <Footer />
    </main>
  );
}