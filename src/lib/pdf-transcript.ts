import jsPDF from "jspdf"
import type { Grade, Subject } from "@/data/schema"

interface TranscriptData {
  studentName: string
  studentNIM: string
  studentProdi: string
  studentAngkatan: string
  grades: Grade[]
  subjects: Subject[]
  cumulativeGPA: number
}

export function generateTranscriptPDF(data: TranscriptData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Header - University Logo and Name
  doc.setFillColor(0, 102, 204) // Blue header
  doc.rect(0, 0, pageWidth, 35, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("UNIVERSITAS NEGERI SURABAYA", pageWidth / 2, 15, { align: "center" })
  
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Kampus Unesa Ketintang, Surabaya", pageWidth / 2, 22, { align: "center" })
  doc.text("Website: www.unesa.ac.id | Email: info@unesa.ac.id", pageWidth / 2, 28, { align: "center" })

  // Reset text color for content
  doc.setTextColor(0, 0, 0)
  yPosition = 45

  // Title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("TRANSKRIP NILAI AKADEMIK", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  // Student Information Box
  doc.setFillColor(240, 240, 240)
  doc.rect(15, yPosition, pageWidth - 30, 35, "F")
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  yPosition += 8

  const leftCol = 20
  const rightCol = 110

  // Left column
  doc.text("Nama", leftCol, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.studentName}`, leftCol + 25, yPosition)
  
  doc.setFont("helvetica", "bold")
  doc.text("NIM", leftCol, yPosition + 7)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.studentNIM}`, leftCol + 25, yPosition + 7)

  // Right column
  doc.setFont("helvetica", "bold")
  doc.text("Program Studi", rightCol, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.studentProdi}`, rightCol + 30, yPosition)
  
  doc.setFont("helvetica", "bold")
  doc.text("Angkatan", rightCol, yPosition + 7)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.studentAngkatan}`, rightCol + 30, yPosition + 7)

  yPosition += 30

  // Group grades by semester
  const gradesBySemester = data.grades.reduce((acc, grade) => {
    if (!acc[grade.term]) {
      acc[grade.term] = []
    }
    acc[grade.term].push(grade)
    return acc
  }, {} as Record<string, Grade[]>)

  const sortedSemesters = Object.keys(gradesBySemester).sort()

  // Process each semester
  sortedSemesters.forEach((semester, semesterIndex) => {
    checkNewPage(40)

    // Semester Header
    doc.setFillColor(0, 102, 204)
    doc.rect(15, yPosition, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`SEMESTER ${semester}`, 20, yPosition + 5.5)
    doc.setTextColor(0, 0, 0)
    yPosition += 13

    // Table Header
    doc.setFillColor(220, 220, 220)
    doc.rect(15, yPosition, pageWidth - 30, 7, "F")
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("No", 18, yPosition + 5)
    doc.text("Kode MK", 28, yPosition + 5)
    doc.text("Nama Mata Kuliah", 55, yPosition + 5)
    doc.text("SKS", 140, yPosition + 5)
    doc.text("Nilai Angka", 155, yPosition + 5)
    doc.text("Nilai Huruf", 180, yPosition + 5)
    yPosition += 10

    // Table Content
    const semesterGrades = gradesBySemester[semester]
    let semesterTotalCredits = 0
    let semesterTotalPoints = 0

    semesterGrades.forEach((grade, index) => {
      checkNewPage(10)

      const subject = data.subjects.find(s => s.id === grade.subjectId)
      if (!subject) return

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      
      // Row background (alternating)
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(15, yPosition - 4, pageWidth - 30, 7, "F")
      }

      doc.text(`${index + 1}`, 18, yPosition)
      doc.text(subject.kode, 28, yPosition)
      
      // Truncate long subject names
      const subjectName = subject.nama.length > 45 ? subject.nama.substring(0, 42) + "..." : subject.nama
      doc.text(subjectName, 55, yPosition)
      
      doc.text(`${subject.sks}`, 143, yPosition)
      doc.text(grade.nilaiAngka ? `${grade.nilaiAngka}` : "-", 160, yPosition)
      doc.text(grade.nilaiHuruf || "-", 185, yPosition)

      // Calculate semester GPA
      if (grade.nilaiHuruf && subject.sks) {
        const gradePoints: Record<string, number> = {
          A: 4.0, "B+": 3.5, B: 3.0, "C+": 2.5, C: 2.0, D: 1.0, E: 0.0
        }
        const points = gradePoints[grade.nilaiHuruf] || 0
        semesterTotalCredits += subject.sks
        semesterTotalPoints += points * subject.sks
      }

      yPosition += 7
    })

    // Semester Summary
    yPosition += 3
    checkNewPage(15)
    
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPosition, pageWidth - 30, 10, "F")
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Total SKS Semester:", 120, yPosition + 6)
    doc.text(`${semesterTotalCredits}`, 155, yPosition + 6)
    
    const semesterGPA = semesterTotalCredits > 0 ? semesterTotalPoints / semesterTotalCredits : 0
    doc.text("IPS:", 165, yPosition + 6)
    doc.text(`${semesterGPA.toFixed(2)}`, 180, yPosition + 6)
    
    yPosition += 15
  })

  // Overall Summary
  checkNewPage(40)
  yPosition += 5

  doc.setFillColor(0, 102, 204)
  doc.rect(15, yPosition, pageWidth - 30, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("RINGKASAN AKADEMIK", 20, yPosition + 5.5)
  doc.setTextColor(0, 0, 0)
  yPosition += 13

  const totalCredits = data.grades.reduce((sum, grade) => {
    const subject = data.subjects.find(s => s.id === grade.subjectId)
    return sum + (subject?.sks || 0)
  }, 0)

  doc.setFillColor(240, 240, 240)
  doc.rect(15, yPosition, pageWidth - 30, 25, "F")
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  yPosition += 8

  doc.text("Total SKS Kumulatif", 20, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${totalCredits} SKS`, 70, yPosition)

  yPosition += 7
  doc.setFont("helvetica", "bold")
  doc.text("Total Mata Kuliah", 20, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.grades.length} Mata Kuliah`, 70, yPosition)

  yPosition += 7
  doc.setFont("helvetica", "bold")
  doc.text("IPK (Indeks Prestasi Kumulatif)", 20, yPosition)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(0, 102, 204)
  doc.text(`: ${data.cumulativeGPA.toFixed(2)}`, 70, yPosition)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  yPosition += 15

  // Predikat
  let predikat = ""
  if (data.cumulativeGPA >= 3.7) predikat = "Dengan Pujian (Cum Laude)"
  else if (data.cumulativeGPA >= 3.0) predikat = "Sangat Memuaskan"
  else if (data.cumulativeGPA >= 2.5) predikat = "Memuaskan"
  else if (data.cumulativeGPA >= 2.0) predikat = "Cukup"
  else predikat = "Kurang"

  if (predikat) {
    doc.setFont("helvetica", "bold")
    doc.text("Predikat Kelulusan", 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(`: ${predikat}`, 70, yPosition)
    yPosition += 10
  }

  // Footer - Print Information
  checkNewPage(30)
  yPosition = pageHeight - 30

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
  doc.text(`Dicetak pada: ${printDate}`, 20, yPosition)
  doc.text("Dokumen ini dicetak dari Sistem Jadwal In - Universitas Negeri Surabaya", 20, yPosition + 5)
  
  // Digital signature note
  doc.setFontSize(7)
  doc.text("* Transkrip ini adalah salinan digital resmi dari sistem akademik", 20, yPosition + 10)

  // Page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 35, pageHeight - 10)
  }

  // Save the PDF
  const fileName = `Transkrip_${data.studentName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`
  doc.save(fileName)
}
