import { create } from "zustand"

export interface Announcement {
  id: string
  title: string
  description: string
  imageUrl?: string | null
  fileUrl?: string | null
  targetRoles: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdById: string
}

interface AnnouncementState {
  announcements: Announcement[]
  isLoading: boolean
  
  // Fetch announcements
  fetchAnnouncements: (role?: string, activeOnly?: boolean) => Promise<void>
  
  // Get active announcements for user role
  getActiveAnnouncements: (role: string) => Announcement[]
  
  // Create announcement
  createAnnouncement: (data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => Promise<Announcement>
  
  // Update announcement
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<Announcement>
  
  // Delete announcement
  deleteAnnouncement: (id: string) => Promise<void>
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  isLoading: false,
  
  fetchAnnouncements: async (role?: string, activeOnly = false) => {
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (role) params.append("role", role)
      if (activeOnly) params.append("activeOnly", "true")
      
      const response = await fetch(`/api/announcements?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch announcements")
      
      const data = await response.json()
      set({ announcements: data, isLoading: false })
    } catch (error) {
      console.error("Error fetching announcements:", error)
      set({ isLoading: false })
    }
  },
  
  getActiveAnnouncements: (role: string) => {
    return get().announcements.filter(
      (announcement) =>
        announcement.isActive &&
        announcement.targetRoles.includes(role)
    )
  },
  
  createAnnouncement: async (data) => {
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) throw new Error("Failed to create announcement")
    
    const announcement = await response.json()
    set((state) => ({
      announcements: [announcement, ...state.announcements],
    }))
    
    return announcement
  },
  
  updateAnnouncement: async (id, data) => {
    const response = await fetch("/api/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    })
    
    if (!response.ok) throw new Error("Failed to update announcement")
    
    const announcement = await response.json()
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? announcement : a
      ),
    }))
    
    return announcement
  },
  
  deleteAnnouncement: async (id) => {
    const response = await fetch(`/api/announcements?id=${id}`, {
      method: "DELETE",
    })
    
    if (!response.ok) throw new Error("Failed to delete announcement")
    
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== id),
    }))
  },
}))
