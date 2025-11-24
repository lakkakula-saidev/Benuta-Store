"use client";

import { NavBar } from "../../components/navbar";
import { CatalogPage } from "../../components/catalog-page";
import { Footer } from "../../components/footer";

const RUGS_CATEGORY_UID = "MTU2NA=="; // Buy Rugs category

export default function TeppichePage() {
  return (
    <main className="bg-[#f2f2ef] pt-20">
      <NavBar />
      <CatalogPage title="Teppiche" categoryUids={[RUGS_CATEGORY_UID]} />
      <Footer />
    </main>
  );
}
