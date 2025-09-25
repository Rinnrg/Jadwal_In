import type { Grade } from "@/data/schema"

// Mock grades data for demonstration
export const mockGrades: Grade[] = [
  {
    id: "grade-1",
    userId: "user-1",
    subjectId: "subject-1",
    term: "2024/2025-Ganjil",
    nilaiAngka: 85,
    nilaiHuruf: "A",
  },
  {
    id: "grade-2",
    userId: "user-1",
    subjectId: "subject-2",
    term: "2024/2025-Ganjil",
    nilaiAngka: 78,
    nilaiHuruf: "B+",
  },
  {
    id: "grade-3",
    userId: "user-1",
    subjectId: "subject-3",
    term: "2024/2025-Ganjil",
    nilaiAngka: 82,
    nilaiHuruf: "B+",
  },
  {
    id: "grade-4",
    userId: "user-1",
    subjectId: "subject-4",
    term: "2023/2024-Genap",
    nilaiAngka: 90,
    nilaiHuruf: "A",
  },
  {
    id: "grade-5",
    userId: "user-1",
    subjectId: "subject-5",
    term: "2023/2024-Genap",
    nilaiAngka: 75,
    nilaiHuruf: "B",
  },
]
