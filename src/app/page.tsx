"use client";

import { NavBar } from "../components/navbar";
import { HeroBanner } from "../components/hero-banner";
import { ProductSlider } from "../components/product-slider";
import { Footer } from "../components/footer";

export default function HomePage() {
  return (
    <main className="bg-[#f2f2ef] flex min-h-screen flex-col">
      <NavBar transparentOnTop />
      <div className="flex-1">
        <HeroBanner />
        <ProductSlider id="beliebte-produkte" title="Beliebte Produkte" />
        <ProductSlider
          id="aktion"
          title="Aktion"
          filter={{ badge: "sale" }}
          sort="price_desc"
        />
      </div>
      <Footer />
    </main>
  );
}
