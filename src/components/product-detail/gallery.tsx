"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductDetailGallery({ images }: { images: string[] }) {
  const validImages = images.filter(Boolean);
  const [active, setActive] = useState(validImages[0]);

  if (!validImages.length) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <Image
          src={active}
          alt="Produktbild"
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
          priority
        />
      </div>
      {validImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              onClick={() => setActive(img)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${
                img === active ? "border-slate-900" : "border-slate-200"
              }`}
              aria-label="Weitere Ansicht"
            >
              <Image
                src={img}
                alt="Produktansicht"
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
