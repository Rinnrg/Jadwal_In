// @ts-nocheck
import { create } from "zustand"
import type { KrsItem } from "@/data/schema"
import { ActivityLogger } from "@/lib/activity-logger"

interface KrsState {
  krsItems: KrsItem[]
  isLoading: boolean
  error: string | null
  lastFetchTime: number
  
  // Actions
  fetchKrsItems: (userId?: string, term?: string, forceRefresh?: boolean) => Promise<void>
  addKrsItem: (userId: string, subjectId: string, term: string, offeringId?: string, subjectName?: string, sks?: number) => Promise<void>
  removeKrsItem: (id: string, userId?: string, subjectName?: string) => Promise<void>
  
  // Getters
  getKrsByUser: (userId: string, term?: string) => KrsItem[]
  getKrsBySubject: (subjectId: string) => KrsItem[]
  isSubjectInKrs: (userId: string, subjectId: string, term: string) => boolean
  isOfferingInKrs: (userId: string, offeringId: string) => boolean
  getTotalSks: (userId: string, term: string, subjects: any[]) => number
  clearKrsByUserAndTerm: (userId: string, term: string) => Promise<void>
  getKrsByOffering: (offeringId: string) => KrsItem[]
}

export const useKrsStore = create<KrsState>()((set, get) => ({
  krsItems: [],
  isLoading: false,
  error: null,
  lastFetchTime: 0,

  fetchKrsItems: async (userId?: string, term?: string, forceRefresh = false) => {
    // Prevent too frequent fetches unless force refresh
    const now = Date.now()
    if (!forceRefresh && now - get().lastFetchTime < 1000) {
      console.log('[KRS Store] Skipping fetch (too soon)')
      return
    }

    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (term) params.append('term', term)
      
      // Add cache busting
      params.append('_t', Date.now().toString())
      
      console.log('[KRS Store] Fetching KRS items:', { userId, term, forceRefresh })
      
      const response = await fetch(`/api/krs?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch KRS items')
      
      const krsItems = await response.json()
      console.log('[KRS Store] Fetched KRS items:', krsItems.length, 'items')
      
      set({ krsItems, isLoading: false, lastFetchTime: now })
    } catch (error) {
      console.error('[KRS Store] Error fetching KRS:', error)
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addKrsItem: async (userId, subjectId, term, offeringId, subjectName, sks) => {
    set({ isLoading: true, error: null })
    try {
      console.log('[KRS Store] Adding KRS item:', { userId, subjectId, term, offeringId })
      
      const response = await fetch('/api/krs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subjectId,
          term,
          offeringId,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[KRS Store] Failed to add:', errorData)
        throw new Error(errorData.error || 'Failed to add KRS item')
      }
      
      const newItem = await response.json()
      console.log('[KRS Store] Added successfully:', newItem)
      
      set((state) => ({
        krsItems: [...state.krsItems, newItem],
        isLoading: false,
      }))
      
      // Log activity
      if (subjectName) {
        ActivityLogger.krsAdded(userId, subjectName, sks || 0)
      }
      
      // DO NOT trigger notification when user adds their own KRS
      // Users shouldn't be notified when they take KRS themselves
      // Notification is disabled as per user requirement
      
      // Force refresh to ensure all clients get updated data
      console.log('[KRS Store] Force refreshing after add...')
      setTimeout(() => get().fetchKrsItems(userId, term, true), 100)
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  removeKrsItem: async (id, userId, subjectName) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/krs?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete KRS item')
      }
      
      set((state) => ({
        krsItems: state.krsItems.filter((item) => item.id !== id),
        isLoading: false,
      }))
      
      // Log activity
      if (userId && subjectName) {
        ActivityLogger.krsRemoved(userId, subjectName)
      }
      
      // Force refresh
      setTimeout(() => get().fetchKrsItems(userId, undefined, true), 100)
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  getKrsByUser: (userId, term) => {
    const items = get().krsItems.filter((item) => item.userId === userId)
    return term ? items.filter((item) => item.term === term) : items
  },

  getKrsBySubject: (subjectId) => {
    return get().krsItems.filter((item) => item.subjectId === subjectId)
  },

  isSubjectInKrs: (userId, subjectId, term) => {
    return get().krsItems.some(
      (item) => item.userId === userId && item.subjectId === subjectId && item.term === term,
    )
  },

  isOfferingInKrs: (userId, offeringId) => {
    return get().krsItems.some((item) => item.userId === userId && item.offeringId === offeringId)
  },

  getTotalSks: (userId, term, subjects) => {
    const userKrs = get().getKrsByUser(userId, term)
    return userKrs.reduce((total, krsItem) => {
      const subject = subjects.find((s) => s.id === krsItem.subjectId)
      return total + (subject?.sks || 0)
    }, 0)
  },

  clearKrsByUserAndTerm: async (userId, term) => {
    set({ isLoading: true, error: null })
    try {
      // Get all KRS items for this user and term
      const itemsToDelete = get().krsItems.filter(
        (item) => item.userId === userId && item.term === term
      )
      
      // Delete each item via API
      await Promise.all(
        itemsToDelete.map((item) =>
          fetch(`/api/krs?id=${item.id}`, { method: 'DELETE' })
        )
      )
      
      set((state) => ({
        krsItems: state.krsItems.filter((item) => !(item.userId === userId && item.term === term)),
        isLoading: false,
      }))
      
      // Log activity
      ActivityLogger.krsCleared(userId)
      
      // Force refresh
      setTimeout(() => get().fetchKrsItems(userId, term, true), 100)
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  getKrsByOffering: (offeringId) => {
    return get().krsItems.filter((item) => item.offeringId === offeringId)
  },
}))
