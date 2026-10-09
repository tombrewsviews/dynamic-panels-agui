"use client";

import { createContext, useContext } from "react";
import type { ActionSchema } from "./action";

/**
 * Tells generated components which item the host currently has open, so a
 * row whose action opens that item can show as selected. Defaults to nothing.
 */
export const SelectionContext = createContext<(action: ActionSchema) => boolean>(() => false);

export const useIsSelected = () => useContext(SelectionContext);
