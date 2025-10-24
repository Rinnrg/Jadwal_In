import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface GradeInfo {
  value: string
  label: string
  bobot: number
  minScore: number
  maxScore: number
  color: string
}

interface GradeInfoCardProps {
  gradeInfo: GradeInfo | null
  score?: number
  className?: string
}

export function GradeInfoCard({ gradeInfo, score, className }: GradeInfoCardProps) {
  if (!gradeInfo) return null

  return (
    <Card className={cn("border-l-4", className)}>
      <CardContent className="p-3 md:p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Nilai Huruf</p>
              <Badge variant="secondary" className={`${gradeInfo.color} text-sm mt-1`}>
                {gradeInfo.label}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Bobot (Mutu)</p>
              <p className="text-xl font-bold mt-1">{gradeInfo.bobot.toFixed(1)}</p>
            </div>
          </div>
          
          {score !== undefined && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Nilai Angka</p>
              <p className="text-lg font-semibold">{score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Range: {gradeInfo.minScore} - {gradeInfo.maxScore}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const gradeOptions: GradeInfo[] = [
  { value: "A", label: "A", bobot: 4.0, minScore: 85, maxScore: 100, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  { value: "A-", label: "A-", bobot: 3.7, minScore: 80, maxScore: 84, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300" },
  { value: "B+", label: "B+", bobot: 3.3, minScore: 75, maxScore: 79, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "B", label: "B", bobot: 3.0, minScore: 70, maxScore: 74, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300" },
  { value: "B-", label: "B-", bobot: 2.7, minScore: 65, maxScore: 69, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  { value: "C+", label: "C+", bobot: 2.3, minScore: 60, maxScore: 64, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "C", label: "C", bobot: 2.0, minScore: 55, maxScore: 59, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/80 dark:text-yellow-300" },
  { value: "C-", label: "C-", bobot: 1.7, minScore: 50, maxScore: 54, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "D+", label: "D+", bobot: 1.3, minScore: 45, maxScore: 49, color: "bg-red-100 text-red-700 dark:bg-red-900/80 dark:text-red-300" },
  { value: "D", label: "D", bobot: 1.0, minScore: 40, maxScore: 44, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "D-", label: "D-", bobot: 0.7, minScore: 35, maxScore: 39, color: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100" },
  { value: "E", label: "E", bobot: 0.0, minScore: 0, maxScore: 34, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
]

export function getGradeFromScore(score: number): GradeInfo {
  const grade = gradeOptions.find(g => score >= g.minScore && score <= g.maxScore)
  return grade || gradeOptions[gradeOptions.length - 1] // Default to E if not found
}

export function getGradeColor(nilaiHuruf?: string): string {
  const grade = gradeOptions.find(g => g.value === nilaiHuruf)
  return grade?.color || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}
