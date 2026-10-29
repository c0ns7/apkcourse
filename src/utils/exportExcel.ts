import * as XLSX from 'xlsx'
import type { AppData } from '../types'
import { formatGrade } from './helpers'

export function exportGradesToExcel(
  data: AppData,
  opts?: { teacherId?: string; academicYear?: string; filename?: string }
) {
  const rows: Array<Record<string, string | number>> = []

  for (const sub of data.submissions) {
    if (sub.status !== 'graded') continue
    const assignment = data.assignments.find((a) => a.id === sub.assignmentId)
    if (!assignment) continue
    const subject = data.subjects.find((s) => s.id === assignment.subjectId)
    if (!subject) continue
    if (opts?.teacherId && subject.teacherId !== opts.teacherId) continue
    const student = data.users.find((u) => u.id === sub.studentId)
    if (!student) continue
    if (opts?.academicYear && student.academicYear !== opts.academicYear) continue

    rows.push({
      Студент: student.fullName,
      Логин: student.login,
      Группа: student.group ?? '',
      Курс: student.course ?? '',
      Специальность: student.specialty ?? '',
      'Учебный год': student.academicYear ?? '',
      Предмет: subject.title,
      Задание: assignment.title,
      Оценка: formatGrade(sub),
      Режим: sub.gradeMode === 'pass_fail' ? 'Зачёт' : 'Балл',
      Комментарий: sub.feedback ?? '',
      Дата: sub.gradedAt ?? '',
    })
  }

  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Сообщение: 'Нет оценённых работ' }])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Оценки')
  XLSX.writeFile(book, opts?.filename ?? 'ocenki.xlsx')
}

export function exportStudentAnalyticsToExcel(
  data: AppData,
  academicYear?: string,
  filename = 'analitika-studenty.xlsx'
) {
  const students = data.users.filter(
    (u) =>
      (u.role === 'student' || u.roles?.includes('student')) &&
      (!academicYear || academicYear === 'all' || u.academicYear === academicYear)
  )

  const rows = students.map((s) => {
    const subs = data.submissions.filter((x) => x.studentId === s.id)
    const graded = subs.filter((x) => x.status === 'graded')
    const numeric = graded.filter((x) => x.gradeMode !== 'pass_fail' && x.score != null)
    const avg =
      numeric.length > 0
        ? Math.round(
            (numeric.reduce((a, b) => a + (b.score ?? 0), 0) / numeric.length) * 10
          ) / 10
        : ''
    const submitted = subs.filter((x) => x.status === 'submitted' || x.status === 'graded').length
    const totalAssign = data.assignments.filter((a) => {
      const subj = data.subjects.find((sj) => sj.id === a.subjectId)
      return subj?.studentIds.includes(s.id)
    }).length
    const rate = totalAssign ? Math.round((submitted / totalAssign) * 100) : 0

    return {
      ФИО: s.fullName,
      Логин: s.login,
      Группа: s.group ?? '',
      Курс: s.course ?? '',
      Специальность: s.specialty ?? '',
      'Учебный год': s.academicYear ?? '',
      'Средний балл': avg,
      'Сдано работ': submitted,
      'Всего заданий': totalAssign,
      'Процент сдачи': rate,
      Зачётов: graded.filter((x) => x.gradeMode === 'pass_fail' && x.passed).length,
      Незачётов: graded.filter((x) => x.gradeMode === 'pass_fail' && !x.passed).length,
    }
  })

  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Сообщение: 'Нет студентов' }])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Студенты')
  XLSX.writeFile(book, filename)
}
