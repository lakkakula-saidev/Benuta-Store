"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

type Price = { value: number; currency: string };

export type ProductListItemInput = {
  id?: string | null;
  sku?: string | null;
  urlKey?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  price?: Price | null;
  variant?: string | null;
  quantity?: number;
};

export type SavedProduct = {
  id: string;
  name: string;
  sku?: string | null;
  urlKey?: string | null;
  imageUrl?: string | null;
  price?: Price | null;
  variant?: string | null;
  quantity: number;
};

type ShopListsState = {
  favorites: SavedProduct[];
  wishlist: SavedProduct[];
  cart: SavedProduct[];
};

type ShopListsContextValue = ShopListsState & {
  toggleFavorite: (product: ProductListItemInput) => void;
  addFavorite: (product: ProductListItemInput) => void;
  addToWishlist: (product: ProductListItemInput) => void;
  addToCart: (product: ProductListItemInput) => void;
  adjustCartQuantity: (productId: string, delta: number) => void;
  removeFavorite: (productId: string) => void;
  removeCartItem: (productId: string) => void;
};

type ListKey = keyof ShopListsState;

const STORAGE_KEYS: Record<ListKey, string> = {
  favorites: "shop:favorites",
  wishlist: "shop:wishlist",
  cart: "shop:cart"
};

const ShopListsContext = createContext<ShopListsContextValue | undefined>(
  undefined
);

export function ShopListsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShopListsState>(() => {
    if (typeof window === "undefined") {
      return { favorites: [], wishlist: [], cart: [] };
    }
    return {
      favorites: readList(STORAGE_KEYS.favorites),
      wishlist: readList(STORAGE_KEYS.wishlist),
      cart: readList(STORAGE_KEYS.cart)
    };
  });

  const updateList = useCallback(
    (
      key: ListKey,
      updater: (entries: SavedProduct[]) => SavedProduct[]
    ): void => {
      setState((prev) => {
        const nextList = updater(prev[key]);
        const nextState = { ...prev, [key]: nextList };
        writeList(STORAGE_KEYS[key], nextList);
        return nextState;
      });
    },
    []
  );

  const toggleFavorite = useCallback(
    (productInput: ProductListItemInput) => {
      const normalized = normalizeProduct(productInput);
      if (!normalized) return;
      updateList("favorites", (entries) => {
        const exists = entries.some((item) => item.id === normalized.id);
        if (exists) {
          return entries.filter((item) => item.id !== normalized.id);
        }
        return [...entries, normalized];
      });
    },
    [updateList]
  );

  const addToWishlist = useCallback(
    (productInput: ProductListItemInput) => {
      const normalized = normalizeProduct(productInput);
      if (!normalized) return;
      updateList("wishlist", (entries) => {
        if (entries.some((item) => item.id === normalized.id)) {
          return entries;
        }
        return [...entries, normalized];
      });
    },
    [updateList]
  );

  const addFavorite = useCallback(
    (productInput: ProductListItemInput) => {
      const normalized = normalizeProduct(productInput);
      if (!normalized) return;
      updateList("favorites", (entries) => {
        if (entries.some((item) => item.id === normalized.id)) {
          return entries;
        }
        return [...entries, normalized];
      });
    },
    [updateList]
  );

  const addToCart = useCallback(
    (productInput: ProductListItemInput) => {
      const normalized = normalizeProduct(productInput);
      if (!normalized) return;
      updateList("cart", (entries) => {
        const next = entries.map((entry) => {
          if (entry.id === normalized.id) {
            return {
              ...entry,
              quantity: entry.quantity + normalized.quantity
            };
          }
          return entry;
        });
        const exists = entries.some((entry) => entry.id === normalized.id);
        if (!exists) {
          next.push(normalized);
        }
        return next;
      });
    },
    [updateList]
  );

  const adjustCartQuantity = useCallback(
    (productId: string, delta: number) => {
      updateList("cart", (entries) => {
        const next = entries
          .map((entry) =>
            entry.id === productId
              ? {
                  ...entry,
                  quantity: Math.max(0, entry.quantity + delta)
                }
              : entry
          )
          .filter((entry) => entry.quantity > 0);
        return next;
      });
    },
    [updateList]
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      updateList("favorites", (entries) =>
        entries.filter((entry) => entry.id !== productId)
      );
    },
    [updateList]
  );

  const removeCartItem = useCallback(
    (productId: string) => {
      updateList("cart", (entries) =>
        entries.filter((entry) => entry.id !== productId)
      );
    },
    [updateList]
  );

  const value = useMemo<ShopListsContextValue>(
    () => ({
      ...state,
      toggleFavorite,
      addFavorite,
      addToWishlist,
      addToCart,
      adjustCartQuantity,
      removeFavorite,
      removeCartItem
    }),
    [
      state,
      toggleFavorite,
      addFavorite,
      addToWishlist,
      addToCart,
      adjustCartQuantity,
      removeFavorite,
      removeCartItem
    ]
  );

  return (
    <ShopListsContext.Provider value={value}>
      {children}
    </ShopListsContext.Provider>
  );
}

export function useShopLists() {
  const ctx = useContext(ShopListsContext);
  if (!ctx) {
    throw new Error("useShopLists must be used within ShopListsProvider");
  }
  return ctx;
}

function normalizeProduct(
  productInput: ProductListItemInput
): SavedProduct | null {
  const id = productInput.id ?? productInput.urlKey ?? productInput.sku ?? null;
  if (!id) return null;
  return {
    id,
    sku: productInput.sku ?? null,
    urlKey: productInput.urlKey ?? null,
    imageUrl: productInput.imageUrl ?? null,
    name: productInput.name ?? productInput.sku ?? "Produkt",
    price: productInput.price ?? null,
    variant: productInput.variant ?? null,
    quantity: Math.max(1, productInput.quantity ?? 1)
  };
}

function readList(key: string): SavedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (entry) => entry && typeof entry.id === "string"
      ) as SavedProduct[];
    }
  } catch {
    // ignore
  }
  return [];
}

function writeList(key: string, entries: SavedProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // ignore
  }
}
