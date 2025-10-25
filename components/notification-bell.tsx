"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useNotificationStore } from "@/stores/notification.store"
import { useSessionStore } from "@/stores/session.store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Calendar, BookOpen, ClipboardList, FileText, Clock } from "lucide-react"

const notificationIcons = {
  krs: BookOpen,
  jadwal: Calendar,
  asynchronous: ClipboardList,
  khs: FileText,
  reminder: Clock,
}

const notificationLabels = {
  krs: "KRS",
  jadwal: "Jadwal",
  asynchronous: "Tugas & Materi",
  khs: "KHS",
  reminder: "Pengingat",
}

const notificationLinks = {
  krs: "/krs",
  jadwal: "/jadwal",
  asynchronous: "/asynchronous",
  khs: "/khs",
  reminder: "/reminders",
}

export function NotificationBell() {
  const { session } = useSessionStore()
  const { getUnreadBadges, markAsRead } = useNotificationStore()

  if (!session) return null

  const unreadBadges = getUnreadBadges(session.id)
  const totalUnread = unreadBadges.reduce((sum, badge) => sum + badge.count, 0)

  const handleNotificationClick = (type: string, userId: string) => {
    markAsRead(type as any, userId)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifikasi</h4>
            {totalUnread > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalUnread} baru
              </Badge>
            )}
          </div>
          
          <Separator />
          
          {unreadBadges.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Tidak ada notifikasi baru
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {unreadBadges.map((badge) => {
                  const Icon = notificationIcons[badge.type]
                  const label = notificationLabels[badge.type]
                  const link = notificationLinks[badge.type]
                  
                  return (
                    <Link 
                      key={badge.id} 
                      href={link}
                      onClick={() => handleNotificationClick(badge.type, badge.userId)}
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="mt-1">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            Update {label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {badge.count} item baru ditambahkan
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(badge.lastUpdated, {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center"
                        >
                          {badge.count}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
