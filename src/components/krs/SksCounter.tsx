"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface SksCounterProps {
  totalSks: number
  maxSks?: number
  minSks?: number
}

export function SksCounter({ totalSks, maxSks = 24, minSks = 12 }: SksCounterProps) {
  const percentage = (totalSks / maxSks) * 100
  const isOverLimit = totalSks > maxSks
  const isUnderMinimum = totalSks < minSks

  const getStatusColor = () => {
    if (isOverLimit) return "destructive"
    if (isUnderMinimum) return "secondary"
    return "default"
  }

  const getStatusIcon = () => {
    if (isOverLimit || isUnderMinimum) {
      return <AlertTriangle className="h-4 w-4" />
    }
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isOverLimit) return "Melebihi batas maksimal"
    if (isUnderMinimum) return "Di bawah minimum"
    return "Sesuai ketentuan"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Total SKS</CardTitle>
        <CardDescription>Jumlah SKS yang diambil semester ini</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{totalSks}</div>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {totalSks}/{maxSks} SKS
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="font-medium">Minimum</div>
            <div className="text-muted-foreground">{minSks} SKS</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="font-medium">Maksimum</div>
            <div className="text-muted-foreground">{maxSks} SKS</div>
          </div>
        </div>

        {isOverLimit && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Anda telah melebihi batas maksimal SKS ({maxSks}). Harap kurangi beberapa mata kuliah.
            </p>
          </div>
        )}

        {isUnderMinimum && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Anda belum mencapai minimum SKS ({minSks}). Tambahkan mata kuliah lagi.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
