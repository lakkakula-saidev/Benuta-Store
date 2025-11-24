"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type RouteLoadingContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
  stopNavigation: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(
  null
);

export function RouteLoadingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setIsVisible(true);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  // Auto-stop navigation after reasonable timeout
  useEffect(() => {
    if (!isNavigating) return undefined;
    const timeout = setTimeout(() => setIsNavigating(false), 2000); // 2 seconds should be enough
    return () => clearTimeout(timeout);
  }, [isNavigating]);

  // Handle visibility animation
  useEffect(() => {
    if (isNavigating) return undefined;
    if (!isVisible) return undefined;
    const timeout = setTimeout(() => setIsVisible(false), 400);
    return () => clearTimeout(timeout);
  }, [isNavigating, isVisible]);

  const value = useMemo(
    () => ({
      isNavigating,
      startNavigation,
      stopNavigation
    }),
    [isNavigating, startNavigation, stopNavigation]
  );

  return (
    <RouteLoadingContext.Provider value={value}>
      {children}
      <RouteLoadingBadge active={isVisible} />
    </RouteLoadingContext.Provider>
  );
}

export function useRouteLoading() {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) {
    throw new Error("useRouteLoading must be used within RouteLoadingProvider");
  }
  return ctx;
}

function RouteLoadingBadge({ active }: { active: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-6 z-95 transition duration-300 ${
        active
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-800 shadow-lg backdrop-blur">
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-700" />
        </span>
        <span>Produkt wird geladen…</span>
      </div>
    </div>
  );
}
