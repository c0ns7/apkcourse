import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { Assignment, AssignmentType, Attachment, EducationForm } from '../../types'
import { AttachmentEditor } from '../../components/AttachmentEditor'
import { AttachmentList } from '../../components/AttachmentFile'
import {
  DEFAULT_ENABLED_ASSIGNMENT_TYPES,
  EDUCATION_FORMS,
  GRADE_MAX,
  assignmentTypeLabels,
  educationFormLabels,
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
    createModule,
    deleteModule,
    assignGroupToTeacher,
    updateSubject,
  } = useApp()
  const [tab, setTab] = useState<'students' | 'assignments' | 'modules'>('assignments')
  const [showAssign, setShowAssign] = useState(false)
  const [showStudent, setShowStudent] = useState(false)
  const [showModule, setShowModule] = useState(false)
  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aDeadline, setADeadline] = useState('')
  const [aType, setAType] = useState<AssignmentType>('essay')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [pairsText, setPairsText] = useState('Беседа — Вопрос-ответ\nДемонстрация — Показ образца')
  const [questionsText, setQuestionsText] = useState('Вопрос 1?\nВопрос 2?')
  const [itemsText, setItemsText] = useState('Элемент А\nЭлемент Б\nЭлемент В')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedForms, setSelectedForms] = useState<EducationForm[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDesc, setModuleDesc] = useState('')
  const [attachGroupId, setAttachGroupId] = useState('')

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
  const myGroups = data.groups.filter(
    (g) => g.teacherId === currentUser.id || (subject.groupIds || []).includes(g.id)
  )
  const availableGroups = data.groups.filter(
    (g) => g.teacherId === currentUser.id || !g.teacherId || (subject.groupIds || []).includes(g.id)
  )
  const myStudents = students.filter(
    (u) =>
      u.teacherId === currentUser.id ||
      subject.studentIds.includes(u.id) ||
      (u.groupId && myGroups.some((g) => g.id === u.groupId))
  )
  const available = myStudents.filter((u) => !subject.studentIds.includes(u.id))
  const enrolled = students.filter((u) => subject.studentIds.includes(u.id))
  const assignments = data.assignments.filter((a) => a.subjectId === id)
  const modules = data.modules
    .filter((m) => m.subjectId === id)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const handleAddStudent = () => {
    if (selectedStudent) {
      addStudentToSubject(id, selectedStudent)
      setSelectedStudent('')
      setShowStudent(false)
    }
  }

  const toggleGroup = (gid: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]
    )
  }

  const toggleForm = (f: EducationForm) => {
    setSelectedForms((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
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
      groupIds: selectedGroupIds,
      educationForms: selectedForms,
      moduleId: selectedModuleId || undefined,
    })
    setATitle('')
    setADesc('')
    setADeadline('')
    setAType(enabledTypes[0] ?? 'essay')
    setAttachments([])
    setSelectedGroupIds([])
    setSelectedForms([])
    setSelectedModuleId('')
    setShowAssign(false)
  }

  const handleAttachGroup = () => {
    if (!attachGroupId) return
    const next = [...new Set([...(subject.groupIds || []), attachGroupId])]
    void updateSubject({ ...subject, groupIds: next })
    void assignGroupToTeacher(attachGroupId)
    setAttachGroupId('')
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
          className={`tab ${tab === 'assignments' ? 'active' : ''}`}
          onClick={() => setTab('assignments')}
        >
          Задания ({assignments.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === 'modules' ? 'active' : ''}`}
          onClick={() => setTab('modules')}
        >
          Модули ({modules.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === 'students' ? 'active' : ''}`}
          onClick={() => setTab('students')}
        >
          Студенты ({enrolled.length})
        </button>
      </div>

      {tab === 'students' && (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary btn-sm" onClick={() => setShowStudent(true)}>
              + Добавить студента
            </button>
          </div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Группы предмета</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.75 }}>
              Закрепите группу — студенты группы получат доступ к заданиям
            </p>
            <div className="filter-chips" style={{ marginBottom: '0.75rem' }}>
              {(subject.groupIds || []).map((gid) => {
                const g = data.groups.find((x) => x.id === gid)
                return g ? (
                  <span key={gid} className="chip active">
                    {g.name} · {educationFormLabels[g.educationForm]}
                  </span>
                ) : null
              })}
              {!(subject.groupIds || []).length && (
                <span style={{ opacity: 0.7 }}>Группы не привязаны</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select value={attachGroupId} onChange={(e) => setAttachGroupId(e.target.value)}>
                <option value="">Выберите группу…</option>
                {availableGroups
                  .filter((g) => !(subject.groupIds || []).includes(g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({educationFormLabels[g.educationForm]})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={!attachGroupId}
                onClick={handleAttachGroup}
              >
                Закрепить группу
              </button>
            </div>
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
                    <th>Форма</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {enrolled.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.group || '—'}</td>
                      <td>
                        {u.educationForm ? educationFormLabels[u.educationForm] : '—'}
                      </td>
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

      {tab === 'modules' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn-primary btn-sm" onClick={() => setShowModule(true)}>
              + Модуль курса
            </button>
          </div>
          <p style={{ fontSize: '0.9rem', opacity: 0.75, marginTop: 0 }}>
            Студент переходит к следующему модулю только после успешного прохождения предыдущего
          </p>
          {modules.length === 0 ? (
            <div className="card empty-state">Модули не созданы</div>
          ) : (
            <div className="grid-2">
              {modules.map((m, i) => (
                <div key={m.id} className="card">
                  <span className="badge">Модуль {i + 1}</span>
                  <h3 style={{ margin: '0.5rem 0' }}>{m.title}</h3>
                  <p style={{ margin: 0, opacity: 0.75 }}>{m.description || 'Без описания'}</p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Заданий: {assignments.filter((a) => a.moduleId === m.id).length}
                  </p>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => confirm('Удалить модуль?') && deleteModule(m.id)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
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
              {assignments.map((a) => {
                const mod = a.moduleId ? modules.find((m) => m.id === a.moduleId) : null
                return (
                  <div key={a.id} className="card">
                    <h3 style={{ margin: '0 0 0.5rem' }}>{a.title}</h3>
                    {a.type && (
                      <span className="badge badge-submitted">{assignmentTypeLabels[a.type]}</span>
                    )}
                    {mod && <span className="badge" style={{ marginLeft: 6 }}>{mod.title}</span>}
                    <AttachmentList items={a.attachments} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                      Срок: {new Date(a.deadline).toLocaleDateString('ru-RU')}
                      {a.groupIds?.length
                        ? ` · групп: ${a.groupIds.length}`
                        : ' · всем на предмете'}
                      {a.educationForms?.length
                        ? ` · ${a.educationForms.map((f) => educationFormLabels[f]).join(', ')}`
                        : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link to={`/teacher/assignment/${a.id}`} className="btn-secondary btn-sm">
                        Просмотр
                      </Link>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => confirm('Удалить задание?') && deleteAssignment(a.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )
              })}
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

      {showModule && (
        <div className="modal-overlay" onClick={() => setShowModule(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новый модуль</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!moduleTitle.trim()) return
                createModule(id, { title: moduleTitle.trim(), description: moduleDesc.trim() })
                setModuleTitle('')
                setModuleDesc('')
                setShowModule(false)
              }}
            >
              <div className="form-group">
                <label>Название</label>
                <input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea rows={3} value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModule(false)}>
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
              </div>

              <div className="form-group">
                <label>Модуль курса</label>
                <select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)}>
                  <option value="">Без модуля</option>
                  {modules.map((m, i) => (
                    <option key={m.id} value={m.id}>
                      {i + 1}. {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Группы (пусто = всем на предмете)</label>
                <div className="filter-chips" style={{ margin: 0 }}>
                  {myGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`chip ${selectedGroupIds.includes(g.id) ? 'active' : ''}`}
                      onClick={() => toggleGroup(g.id)}
                    >
                      {g.name}
                    </button>
                  ))}
                  {!myGroups.length && (
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      Сначала закрепите группы во вкладке «Студенты»
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Формы обучения (пусто = все)</label>
                <div className="filter-chips" style={{ margin: 0 }}>
                  {EDUCATION_FORMS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`chip ${selectedForms.includes(f) ? 'active' : ''}`}
                      onClick={() => toggleForm(f)}
                    >
                      {educationFormLabels[f]}
                    </button>
                  ))}
                </div>
              </div>

              {aType === 'matching' && (
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
                <label>Вложения</label>
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
