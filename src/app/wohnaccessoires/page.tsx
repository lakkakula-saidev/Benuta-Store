"use client";

import { NavBar } from "../../components/navbar";
import { CatalogPage } from "../../components/catalog-page";
import { Footer } from "../../components/footer";

const ACCESSORIES_CATEGORY_UID = "MTI1Mg=="; // Home Accessories

export default function WohnAccessoiresPage() {
  return (
    <main className="bg-[#f2f2ef] pt-20">
      <NavBar />
      <CatalogPage
        title="Wohn Accessoires"
        categoryUids={[ACCESSORIES_CATEGORY_UID]}
      />
      <Footer />
    </main>
  );
}
