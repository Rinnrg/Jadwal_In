"use client"

import { useEffect, useState } from "react"
import { useAnnouncementStore } from "@/stores/announcement.store"
import { useSessionStore } from "@/stores/session.store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Megaphone, X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Image from "next/image"

const VIEWED_KEY = "jadwalin:viewed-announcements:v1"

export function AnnouncementPopup() {
  const { session } = useSessionStore()
  const { announcements, fetchAnnouncements } = useAnnouncementStore()
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewedIds, setViewedIds] = useState<string[]>([])

  useEffect(() => {
    if (!session) return

    // Fetch active announcements for user role
    fetchAnnouncements(session.role, true)

    // Load viewed announcements from localStorage
    const stored = localStorage.getItem(VIEWED_KEY)
    if (stored) {
      try {
        setViewedIds(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse viewed announcements", e)
      }
    }
  }, [session, fetchAnnouncements])

  useEffect(() => {
    if (!session || announcements.length === 0) return

    // Filter unviewed announcements
    const unviewedAnnouncements = announcements.filter(
      (announcement) => !viewedIds.includes(announcement.id)
    )

    if (unviewedAnnouncements.length > 0) {
      setIsOpen(true)
    }
  }, [announcements, viewedIds, session])

  const unviewedAnnouncements = announcements.filter(
    (announcement) => !viewedIds.includes(announcement.id)
  )

  const currentAnnouncement = unviewedAnnouncements[currentIndex]

  const handleClose = () => {
    if (currentAnnouncement) {
      markAsViewed(currentAnnouncement.id)
    }
    setIsOpen(false)
    setCurrentIndex(0)
  }

  const handleNext = () => {
    if (currentAnnouncement) {
      markAsViewed(currentAnnouncement.id)
    }

    if (currentIndex < unviewedAnnouncements.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsOpen(false)
      setCurrentIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const markAsViewed = (id: string) => {
    const newViewedIds = [...viewedIds, id]
    setViewedIds(newViewedIds)
    localStorage.setItem(VIEWED_KEY, JSON.stringify(newViewedIds))
  }

  if (!currentAnnouncement) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">{currentAnnouncement.title}</DialogTitle>
          </div>
        </DialogHeader>

        <Separator className="mx-6" />

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Image */}
            {currentAnnouncement.imageUrl && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={currentAnnouncement.imageUrl}
                  alt={currentAnnouncement.title}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // Hide image if failed to load
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}

            {/* Description */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{currentAnnouncement.description}</p>
            </div>

            {/* PDF Link */}
            {currentAnnouncement.fileUrl && (
              <div>
                <a
                  href={currentAnnouncement.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Lihat Dokumen PDF
                </a>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="mx-6" />

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} dari {unviewedAnnouncements.length} pengumuman
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <Button variant="default" size="sm" onClick={handleNext}>
              {currentIndex < unviewedAnnouncements.length - 1 ? (
                <>
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "Tutup"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
