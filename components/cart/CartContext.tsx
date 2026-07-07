"use client";
// ─────────────────────────────────────────────────────────────
// Client-side cart. Persists to localStorage, handles products +
// variants + per-item notes. Line identity = variantId + notes.
// ─────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "opendoor-cart-v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  longestLeadTime: number;
  hasCelebration: boolean;
  add: (item: CartItem) => void;
  setQty: (variantId: number | null, notes: string | undefined, qty: number) => void;
  remove: (variantId: number | null, notes: string | undefined) => void;
  clear: () => void;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartItem, variantId: number | null, notes: string | undefined) {
  return a.variantId === variantId && (a.notes || "") === (notes || "");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((c) => sameLine(c, item.variantId, item.notes));
      if (existing) {
        return prev.map((c) =>
          c === existing ? { ...c, quantity: c.quantity + item.quantity } : c
        );
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback(
    (variantId: number | null, notes: string | undefined, qty: number) => {
      setItems((prev) =>
        prev
          .map((c) => (sameLine(c, variantId, notes) ? { ...c, quantity: Math.max(0, qty) } : c))
          .filter((c) => c.quantity > 0)
      );
    },
    []
  );

  const remove = useCallback((variantId: number | null, notes: string | undefined) => {
    setItems((prev) => prev.filter((c) => !sameLine(c, variantId, notes)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((t, c) => t + c.quantity, 0);
    const subtotal = items.reduce((t, c) => t + c.price * c.quantity, 0);
    const longestLeadTime = items.reduce((m, c) => Math.max(m, c.leadTimeDays), 0);
    const hasCelebration = items.some((c) => c.celebration);
    return { items, count, subtotal, longestLeadTime, hasCelebration, add, setQty, remove, clear, ready };
  }, [items, add, setQty, remove, clear, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
