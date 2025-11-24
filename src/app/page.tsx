"use client";

import { NavBar } from "../components/navbar";
import { HeroBanner } from "../components/hero-banner";
import { ProductSlider } from "../components/product-slider";
import { Footer } from "../components/footer";

export default function HomePage() {
  return (
    <main className="bg-[#f2f2ef]">
      <NavBar transparentOnTop />
      <HeroBanner />
      <ProductSlider title="Beliebte Teppiche" />
      <ProductSlider
        title="Aktion"
        filter={{ badge: "sale" }}
        sort="price_desc"
      />
      <Footer />
    </main>
  );
}
