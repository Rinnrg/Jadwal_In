import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface Activity {
  id: string
  userId: string
  title: string
  description?: string
  timestamp: number
  icon: string // Icon name as string for persistence
  color: string
  category: "schedule" | "krs" | "reminder" | "subject" | "attendance" | "assignment" | "material" | "profile" | "other"
}

interface ActivityState {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
  getActivitiesByUser: (userId: string, limit?: number) => Activity[]
  clearActivities: (userId: string) => void
  clearAllActivities: () => void
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],
      
      addActivity: (activity: Omit<Activity, "id" | "timestamp">) => {
        const newActivity: Activity = {
          ...activity,
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        }
        
        set((state: ActivityState) => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep only last 100 activities
        }))
      },
      
      getActivitiesByUser: (userId: string, limit = 10) => {
        return get()
          .activities
          .filter((activity: Activity) => activity.userId === userId)
          .slice(0, limit)
      },
      
      clearActivities: (userId: string) => {
        set((state: ActivityState) => ({
          activities: state.activities.filter((activity: Activity) => activity.userId !== userId),
        }))
      },
      
      clearAllActivities: () => {
        set({ activities: [] })
      },
    }),
    {
      name: "jadwalin:activities:v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
