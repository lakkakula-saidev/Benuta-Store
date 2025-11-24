"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { useHeroContent, type HeroContent } from "../lib/api/contentful";

const FALLBACK_HERO: HeroContent = {
  title: "Winterkollektion 2025",
  subtitle:
    "Strahlende Farben und kuschelige Texturen für die kalte Jahreszeit",
  ctaLabel: "Zum Shop",
  ctaUrl: "/teppiche",
  tagline: "Neu",
  theme: "light",
  alignment: "left",
  backgroundOverlay: true,
  image: null
};

export function HeroBanner() {
  const { data, isLoading, isError } = useHeroContent();

  const slides = useMemo<HeroContent[]>(() => {
    const items = data?.heroes ?? [];
    if (items.length === 0) return [FALLBACK_HERO];
    return items.filter(Boolean) as HeroContent[];
  }, [data]);

  const [index, setIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [backgroundKey, setBackgroundKey] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setAnimationKey((prev) => prev + 1);
    setBackgroundKey((prev) => prev + 1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [index]);

  const hero = slides[index] ?? FALLBACK_HERO;
  const isLight = hero.theme !== "dark";

  if (isLoading && !data) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Lädt...</div>
      </div>
    );
  }

  return (
    <section
      className={`relative flex min-h-screen items-stretch overflow-hidden ${
        isLight ? "text-white" : "text-slate-900"
      }`}
    >
      <div
        key={backgroundKey}
        className={`absolute inset-0 transition duration-700 ${
          direction === "right"
            ? "animate-slide-in-right"
            : "animate-slide-in-left"
        }`}
        style={
          hero.image?.url
            ? {
                backgroundImage: `url(${hero.image.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }
            : {
                background:
                  "linear-gradient(135deg, #0d1e38 0%, #132b4d 40%, #1f3659 100%)"
              }
        }
      />
      {hero.backgroundOverlay || hero.image?.url ? (
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent" />
      ) : null}
      <div className="relative container-max flex w-full flex-col justify-center gap-8 px-4 pb-24 pt-16 lg:flex-row lg:items-center lg:justify-start lg:px-6 lg:py-24">
        <div
          key={animationKey}
          className="z-10 max-w-2xl space-y-4 animate-hero-fade text-left"
        >
          {hero.tagline ? (
            <p className="text-xs uppercase tracking-[0.28em] animate-hero-slide">
              {hero.tagline}
            </p>
          ) : null}
          <h1 className="animate-hero-slide text-4xl font-semibold leading-tight md:text-5xl">
            {hero.title ?? "Entdecke unsere Kollektion"}
          </h1>
          <p className="animate-hero-slide text-base opacity-90 delay-150">
            {hero.subtitle ??
              "Inspiration für jedes Zimmer – stilvoll, langlebig und sofort lieferbar."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={hero.ctaUrl ?? "#products"}
              className={`rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white"
              }`}
            >
              {hero.ctaLabel ?? "Mehr erfahren"}
            </a>
            <a
              href="#products"
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                isLight
                  ? "border-white/70 text-white hover:bg-white/10"
                  : "border-slate-900/70 text-slate-900 hover:bg-slate-900/5"
              }`}
            >
              Kollektion ansehen
            </a>
          </div>
        </div>
        {isLoading ? (
          <div className="z-10 h-48 w-full animate-pulse rounded-3xl bg-white/20 lg:h-60" />
        ) : null}
        {isError ? (
          <div className="z-10 rounded-3xl border border-white/20 bg-white/10 p-4 text-sm">
            Content block konnte nicht geladen werden.
          </div>
        ) : null}
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-12 right-6 z-20 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDirection("left");
              setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/15 text-white backdrop-blur shadow transition hover:scale-105"
            aria-label="Vorheriger Slide"
          >
            <span className="text-lg">‹</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("right");
              setIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white text-slate-900 shadow transition hover:scale-105"
            aria-label="Nächster Slide"
          >
            <span className="text-lg">›</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
