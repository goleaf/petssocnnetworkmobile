"use client"

import { create } from "zustand"
import type { PinnedItem, PinnedItemType } from "./types"
import {
  getPinnedItems,
  togglePinnedItem,
  isItemPinned,
  addPinnedItem,
  removePinnedItem,
} from "./storage"

interface PinnedItemsState {
  pinnedItems: PinnedItem[]
  isLoading: boolean
  loadPinnedItems: () => void
  pinItem: (
    type: PinnedItemType,
    itemId: string,
    metadata?: { title?: string; description?: string; image?: string }
  ) => { success: boolean; error?: string }
  unpinItem: (type: PinnedItemType, itemId: string) => { success: boolean; error?: string }
  togglePin: (
    type: PinnedItemType,
    itemId: string,
    metadata?: { title?: string; description?: string; image?: string }
  ) => { success: boolean; error?: string; isPinned: boolean }
  checkIsPinned: (type: PinnedItemType, itemId: string) => boolean
}

export const usePinnedItems = create<PinnedItemsState>((set, get) => ({
  pinnedItems: [],
  isLoading: false,

  loadPinnedItems: () => {
    set({ isLoading: true })
    const items = getPinnedItems()
    set({ pinnedItems: items, isLoading: false })
  },

  pinItem: (type, itemId, metadata) => {
    const result = addPinnedItem(type, itemId, metadata)
    if (result.success) {
      get().loadPinnedItems()
    }
    return result
  },

  unpinItem: (type, itemId) => {
    const result = removePinnedItem(type, itemId)
    if (result.success) {
      get().loadPinnedItems()
    }
    return result
  },

  togglePin: (type, itemId, metadata) => {
    const result = togglePinnedItem(type, itemId, metadata)
    if (result.success || !result.error) {
      get().loadPinnedItems()
    }
    return result
  },

  checkIsPinned: (type, itemId) => {
    return isItemPinned(type, itemId)
  },
}))

