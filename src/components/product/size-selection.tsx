"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/** The size chosen on a product page, shared by the size table (full width) and the purchase box. */
const SizeSelection = createContext<{ sizeId: string; setSizeId: (id: string) => void } | null>(null);

export function SizeSelectionProvider({ initialSizeId, children }: { initialSizeId: string; children: ReactNode }) {
  const [sizeId, setSizeId] = useState(initialSizeId);
  return <SizeSelection.Provider value={{ sizeId, setSizeId }}>{children}</SizeSelection.Provider>;
}

/** The shared selection, or a local one when the page has no provider. */
export function useSizeSelection(fallbackId: string) {
  const shared = useContext(SizeSelection);
  const [local, setLocal] = useState(fallbackId);
  return shared ?? { sizeId: local, setSizeId: setLocal };
}
