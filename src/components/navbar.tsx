/* Simple Shopper-like navigation bar with sticky behavior */
"use client";

import { ReactNode, forwardRef, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShopLists } from "../context/shop-lists";
import { IconHeart, IconCart, IconSearch } from "./icons";
import { ProductListOverlay } from "./product-list-overlay";
import { ProductListItemInput } from "../context/shop-lists";

const navLinks = [
  { label: "Teppiche", href: "/teppiche" },
  { label: "Wohn Accessoires", href: "/wohnaccessoires" }
];

const iconStyle = "h-5 w-5 stroke-[1.6] text-slate-900";

export function NavBar({
  transparentOnTop = false
}: {
  transparentOnTop?: boolean;
}) {
  const [scrollY, setScrollY] = useState(0);
  const scrolled = transparentOnTop ? scrollY > 8 : true;
  const pathname = usePathname();
  const {
    favorites,
    cart,
    addToCart,
    adjustCartQuantity,
    removeFavorite,
    removeCartItem
  } = useShopLists();
  const favoritesCount = favorites.length;
  const cartCount = cart.length;
  const [openPanel, setOpenPanel] = useState<"favorites" | "cart" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const favoritesButtonRef = useRef<HTMLButtonElement | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleIncreaseCart = (item: (typeof cart)[number]) => {
    const payload: ProductListItemInput = {
      id: item.id,
      sku: item.sku,
      urlKey: item.urlKey,
      name: item.name,
      variant: item.variant,
      imageUrl: item.imageUrl ?? undefined,
      price: item.price ?? undefined,
      quantity: 1
    };
    addToCart(payload);
  };

  const handleDecreaseCart = (item: (typeof cart)[number]) => {
    adjustCartQuantity(item.id, -1);
  };

  const handleRemoveFavorite = (item: (typeof favorites)[number]) => {
    removeFavorite(item.id);
  };

  const handleRemoveCart = (item: (typeof cart)[number]) => {
    removeCartItem(item.id);
  };

  useEffect(() => {
    if (!transparentOnTop) {
      return;
    }
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnTop]);

  const isTransparent = transparentOnTop && !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        isTransparent ? "bg-transparent" : "shadow-md bg-white"
      }`}
    >
      <div
        className={`container-max items-center gap-6 px-4 py-3 md:px-6 ${
          isTransparent ? "text-white drop-shadow" : "text-slate-900"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1 p-2 rounded ${
            isTransparent
              ? "text-white hover:bg-white/10"
              : "text-slate-900 hover:bg-slate-100"
          }`}
          aria-label="Toggle mobile menu"
        >
          <span
            className={`block w-5 h-0.5 bg-current transition-transform ${
              isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-opacity ${
              isMobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-transform ${
              isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          />
        </button>

        <Link
          href="/"
          className={`text-2xl font-semibold tracking-tight ${
            isTransparent ? "text-white" : "text-slate-900"
          }`}
          aria-label="Shopper home"
        >
          Shopper
        </Link>

        <nav className="hidden flex-1 items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-lg font-medium ${
                isActive(pathname, link.href)
                  ? isTransparent
                    ? "text-white underline underline-offset-4"
                    : "text-slate-900 underline underline-offset-4"
                  : isTransparent
                  ? "text-white/90 hover:text-white"
                  : "text-slate-900 hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <div
            className={`hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold lg:flex ${
              isTransparent
                ? "bg-white/20 text-white"
                : "bg-white/80 text-slate-800"
            }`}
          >
            <span>Suchen</span>
            <IconSearch
              className={
                isTransparent ? "h-5 w-5 stroke-[1.6] text-white" : iconStyle
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <NavStatusButton
                ref={favoritesButtonRef}
                label="Favoriten"
                count={favoritesCount}
                icon={<IconHeart className={iconStyle} />}
                transparent={isTransparent}
                onClick={() =>
                  setOpenPanel((prev) =>
                    prev === "favorites" ? null : "favorites"
                  )
                }
              />
              {openPanel === "favorites" ? (
                <ProductListOverlay
                  title="Favoriten"
                  items={favorites}
                  onClose={() => setOpenPanel(null)}
                  anchorRef={favoritesButtonRef as React.RefObject<HTMLElement>}
                  onRemove={handleRemoveFavorite}
                />
              ) : null}
            </div>
            <div className="relative">
              <NavStatusButton
                ref={cartButtonRef}
                label="Warenkorb"
                count={cartCount}
                icon={<IconCart className={iconStyle} />}
                transparent={isTransparent}
                onClick={() =>
                  setOpenPanel((prev) => (prev === "cart" ? null : "cart"))
                }
              />
              {openPanel === "cart" ? (
                <ProductListOverlay
                  title="Warenkorb"
                  items={cart}
                  onClose={() => setOpenPanel(null)}
                  anchorRef={cartButtonRef as React.RefObject<HTMLElement>}
                  onIncrement={handleIncreaseCart}
                  onDecrement={handleDecreaseCart}
                  onRemove={handleRemoveCart}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-1/2 transform -translate-x-1/2 w-5/6 bg-white shadow-lg border border-slate-200 rounded-lg z-50">
          <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-6 py-3 text-lg font-medium border-b border-slate-100 ${
                  isActive(pathname, link.href)
                    ? "text-slate-900 bg-slate-50"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-6 py-3">
              <div className="flex items-center gap-2 text-slate-700">
                <span>Suchen</span>
                <IconSearch className="h-5 w-5 stroke-[1.6]" />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname || href === "#" || href === "") return false;
  return pathname.startsWith(href);
}

type NavStatusButtonProps = {
  label: string;
  count: number;
  icon: ReactNode;
  onClick: () => void;
  transparent?: boolean;
};

const NavStatusButton = forwardRef<HTMLButtonElement, NavStatusButtonProps>(
  function NavStatusButtonComponent(
    { label, count, icon, onClick, transparent },
    ref
  ) {
    return (
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition hover:border-slate-400 ${
          transparent
            ? "border-white/60 bg-white/20 text-white backdrop-blur"
            : "border-slate-200 bg-white/90 text-slate-900"
        }`}
        aria-label={`${label} (${count})`}
      >
        {icon}
        <span className="absolute -top-1 -right-1 rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold text-white">
          {count}
        </span>
      </button>
    );
  }
);
