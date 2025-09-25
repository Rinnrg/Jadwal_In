import Hero from "@/components/hero";
import Partners from "@/components/partners";
import Testimonials from "@/components/testimonials";
import Stats from "@/components/stats";
import Pricing from "@/components/pricing";
import Faq from "@/components/faq";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-dvh">
      <NavBar />
      <Hero />
      <Partners />
      <Testimonials />
      <Stats />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}