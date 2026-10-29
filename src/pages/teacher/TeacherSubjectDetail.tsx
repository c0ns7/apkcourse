import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { Assignment, AssignmentType, Attachment } from '../../types'
import { AttachmentEditor } from '../../components/AttachmentEditor'
import { AttachmentList } from '../../components/AttachmentFile'
import {
  DEFAULT_ENABLED_ASSIGNMENT_TYPES,
  GRADE_MAX,
  assignmentTypeLabels,
} from '../../utils/helpers'

export function TeacherSubjectDetail() {
  const { id } = useParams<{ id: string }>()
  const {
    data,
    currentUser,
    addStudentToSubject,
    removeStudentFromSubject,
    createAssignment,
    deleteAssignment,
  } = useApp()
  const [tab, setTab] = useState<'students' | 'assignments'>('students')
  const [showAssign, setShowAssign] = useState(false)
  const [showStudent, setShowStudent] = useState(false)
  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aDeadline, setADeadline] = useState('')
  const [aType, setAType] = useState<AssignmentType>('essay')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [pairsText, setPairsText] = useState('Беседа — Вопрос-ответ\nДемонстрация — Показ образца')
  const [questionsText, setQuestionsText] = useState('Вопрос 1?\nВопрос 2?')
  const [itemsText, setItemsText] = useState('Элемент А\nЭлемент Б\nЭлемент В')
  const [selectedStudent, setSelectedStudent] = useState('')

  if (!currentUser || !id) return null

  const subject = data.subjects.find((s) => s.id === id && s.teacherId === currentUser.id)
  if (!subject) {
    return (
      <div className="page">
        <p>Предмет не найден</p>
        <Link to="/teacher/subjects">← К предметам</Link>
      </div>
    )
  }

  const enabledTypes =
    currentUser.enabledAssignmentTypes?.length
      ? currentUser.enabledAssignmentTypes
      : DEFAULT_ENABLED_ASSIGNMENT_TYPES

  const students = data.users.filter((u) => u.role === 'student' || u.roles?.includes('student'))
  const myStudents = students.filter(
    (u) => u.teacherId === currentUser.id || subject.studentIds.includes(u.id)
  )
  const available = myStudents.filter((u) => !subject.studentIds.includes(u.id))
  const enrolled = students.filter((u) => subject.studentIds.includes(u.id))
  const assignments = data.assignments.filter((a) => a.subjectId === id)

  const handleAddStudent = () => {
    if (selectedStudent) {
      addStudentToSubject(id, selectedStudent)
      setSelectedStudent('')
      setShowStudent(false)
    }
  }

  const buildPayload = (): Assignment['payload'] | undefined => {
    if (aType === 'matching') {
      const pairs = pairsText
        .split('\n')
        .map((line) => line.split(/[—\-–]/).map((x) => x.trim()))
        .filter((p) => p[0] && p[1])
        .map(([left, right]) => ({ left, right }))
      return pairs.length ? { pairs } : undefined
    }
    if (aType === 'qa' || aType === 'test' || aType === 'quiz') {
      const questions = questionsText
        .split('\n')
        .map((q) => q.trim())
        .filter(Boolean)
        .map((question) => ({ question }))
      return questions.length ? { questions } : undefined
    }
    if (aType === 'distribution') {
      const items = itemsText
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
      return items.length ? { items } : undefined
    }
    return undefined
  }

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aTitle.trim() || !aDeadline) return
    createAssignment(id, {
      title: aTitle.trim(),
      description: aDesc.trim(),
      deadline: aDeadline,
      maxScore: GRADE_MAX,
      type: aType,
      attachments: attachments.length ? attachments : undefined,
      payload: buildPayload(),
    })
    setATitle('')
    setADesc('')
    setADeadline('')
    setAType(enabledTypes[0] ?? 'essay')
    setAttachments([])
    setShowAssign(false)
  }

  return (
    <div className="page">
      <Link
        to="/teacher/subjects"
        style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'inline-block' }}
      >
        ← Предметы
      </Link>
      <header className="page-header">
        <h1>{subject.title}</h1>
        <p>{subject.description}</p>
      </header>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === 'students' ? 'active' : ''}`}
          onClick={() => setTab('students')}
        >
          Студенты ({enrolled.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === 'assignments' ? 'active' : ''}`}
          onClick={() => setTab('assignments')}
        >
          Задания ({assignments.length})
        </button>
      </div>

      {tab === 'students' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn-primary btn-sm" onClick={() => setShowStudent(true)}>
              + Добавить студента
            </button>
          </div>
          {enrolled.length === 0 ? (
            <div className="card empty-state">Нет студентов на предмете</div>
          ) : (
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Группа</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {enrolled.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.group || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          onClick={() => removeStudentFromSubject(id, u.id)}
                        >
                          Убрать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'assignments' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn-primary btn-sm" onClick={() => setShowAssign(true)}>
              + Новое задание
            </button>
          </div>
          {assignments.length === 0 ? (
            <div className="card empty-state">Нет заданий</div>
          ) : (
            <div className="grid-2">
              {assignments.map((a) => (
                <div key={a.id} className="card">
                  <h3 style={{ margin: '0 0 0.5rem' }}>{a.title}</h3>
                  {a.type && (
                    <span className="badge badge-submitted">{assignmentTypeLabels[a.type]}</span>
                  )}
                  <AttachmentList items={a.attachments} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                    Срок: {new Date(a.deadline).toLocaleDateString('ru-RU')} · оценка или зачёт
                  </p>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => confirm('Удалить задание?') && deleteAssignment(a.id)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showStudent && (
        <div className="modal-overlay" onClick={() => setShowStudent(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить студента</h2>
            <div className="form-group">
              <label>Студент</label>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Выберите...</option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} {u.group ? `(${u.group})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowStudent(false)}>
                Отмена
              </button>
              <button type="button" className="btn-primary" onClick={handleAddStudent}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2>Новое задание</h2>
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label>Название</label>
                <input value={aTitle} onChange={(e) => setATitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea rows={3} value={aDesc} onChange={(e) => setADesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Срок сдачи</label>
                <input
                  type="date"
                  value={aDeadline}
                  onChange={(e) => setADeadline(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Тип задания</label>
                <select
                  value={aType}
                  onChange={(e) => setAType(e.target.value as AssignmentType)}
                >
                  {enabledTypes.map((t) => (
                    <option key={t} value={t}>
                      {assignmentTypeLabels[t]}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                  Настроить список типов можно в профиле (кабинет).
                </p>
              </div>

              {(aType === 'matching') && (
                <div className="form-group">
                  <label>Пары соответствий (строка: Левое — Правое)</label>
                  <textarea rows={4} value={pairsText} onChange={(e) => setPairsText(e.target.value)} />
                </div>
              )}
              {(aType === 'qa' || aType === 'test' || aType === 'quiz') && (
                <div className="form-group">
                  <label>Вопросы (по одному на строку)</label>
                  <textarea
                    rows={4}
                    value={questionsText}
                    onChange={(e) => setQuestionsText(e.target.value)}
                  />
                </div>
              )}
              {aType === 'distribution' && (
                <div className="form-group">
                  <label>Элементы для распределения</label>
                  <textarea rows={4} value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label>Вложения (ссылки, файлы, фото, презентации)</label>
                <AttachmentEditor value={attachments} onChange={setAttachments} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAssign(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
