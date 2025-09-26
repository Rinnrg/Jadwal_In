"use client"

import { useUIStore } from "@/stores/ui.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showSuccess } from "@/lib/alerts"

export function PreferencesCard() {
  const {
    theme,
    language,
    format24h,
    showNowLine,
    showLegend,
    snapInterval,
    setTheme,
    setLanguage,
    setFormat24h,
    setShowNowLine,
    setShowLegend,
    setSnapInterval,
  } = useUIStore()

  const handleThemeChange = (newTheme: "system" | "light" | "dark") => {
    setTheme(newTheme)
    showSuccess("Tema berhasil diubah")
  }

  const handleLanguageChange = (newLanguage: "id" | "en") => {
    setLanguage(newLanguage)
    showSuccess("Bahasa berhasil diubah")
  }

  const handleFormat24hChange = (checked: boolean) => {
    setFormat24h(checked)
    showSuccess(`Format waktu diubah ke ${checked ? "24 jam" : "12 jam"}`)
  }

  const handleShowNowLineChange = (checked: boolean) => {
    setShowNowLine(checked)
    showSuccess(`Garis waktu ${checked ? "ditampilkan" : "disembunyikan"}`)
  }

  const handleShowLegendChange = (checked: boolean) => {
    setShowLegend(checked)
    showSuccess(`Legenda ${checked ? "ditampilkan" : "disembunyikan"}`)
  }

  const handleSnapIntervalChange = (value: string) => {
    const interval = Number.parseInt(value)
    setSnapInterval(interval)
    showSuccess(`Interval snap diubah ke ${interval} menit`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi</CardTitle>
        <CardDescription>Sesuaikan pengalaman menggunakan aplikasi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Bahasa</Label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">Indonesia</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Format 24 Jam</Label>
            <p className="text-sm text-muted-foreground">Gunakan format 24 jam untuk waktu</p>
          </div>
          <Switch checked={format24h} onCheckedChange={handleFormat24hChange} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Garis Waktu Sekarang</Label>
            <p className="text-sm text-muted-foreground">Tampilkan garis waktu saat ini di jadwal</p>
          </div>
          <Switch checked={showNowLine} onCheckedChange={handleShowNowLineChange} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Legenda Jadwal</Label>
            <p className="text-sm text-muted-foreground">Tampilkan legenda warna di jadwal</p>
          </div>
          <Switch checked={showLegend} onCheckedChange={handleShowLegendChange} />
        </div>

        <div className="space-y-2">
          <Label>Interval Snap (menit)</Label>
          <Select value={snapInterval.toString()} onValueChange={handleSnapIntervalChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 menit</SelectItem>
              <SelectItem value="10">10 menit</SelectItem>
              <SelectItem value="15">15 menit</SelectItem>
              <SelectItem value="30">30 menit</SelectItem>
              <SelectItem value="60">60 menit</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Interval waktu untuk menambah jadwal</p>
        </div>
      </CardContent>
    </Card>
  )
}
