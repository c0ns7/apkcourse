import { useState } from 'react'
import type { Attachment, AttachmentKind } from '../types'
import { AttachmentList } from './AttachmentFile'

function uid() {
  return crypto.randomUUID()
}

export function AttachmentEditor({
  value,
  onChange,
}: {
  value: Attachment[]
  onChange: (next: Attachment[]) => void
}) {
  const [kind, setKind] = useState<AttachmentKind>('file')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const add = () => {
    if (!name.trim()) return
    onChange([
      ...value,
      {
        id: uid(),
        kind,
        name: name.trim(),
        url: url.trim() || undefined,
      },
    ])
    setName('')
    setUrl('')
  }

  const onFile = (file: File | null, fileKind: AttachmentKind) => {
    if (!file) return
    const reader = new FileReader()
    if (fileKind === 'image') {
      reader.onload = () => {
        onChange([
          ...value,
          {
            id: uid(),
            kind: 'image',
            name: file.name,
            url: typeof reader.result === 'string' ? reader.result : undefined,
          },
        ])
      }
      reader.readAsDataURL(file)
    } else {
      onChange([
        ...value,
        { id: uid(), kind: fileKind, name: file.name },
      ])
    }
  }

  return (
    <div className="attachment-editor">
      <AttachmentList items={value} />
      {value.length > 0 && (
        <ul className="chip-list">
          {value.map((a) => (
            <li key={a.id} className="chip">
              {a.name}
              <button
                type="button"
                className="chip-remove"
                onClick={() => onChange(value.filter((x) => x.id !== a.id))}
                aria-label="Удалить"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="form-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
        <select value={kind} onChange={(e) => setKind(e.target.value as AttachmentKind)}>
          <option value="link">Ссылка</option>
          <option value="file">Файл</option>
          <option value="image">Фото</option>
          <option value="presentation">Презентация</option>
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === 'link' ? 'Название ссылки' : 'Имя файла'}
        />
        {(kind === 'link' || kind === 'presentation') && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        )}
        <button type="button" className="btn-secondary btn-sm" onClick={add}>
          Добавить
        </button>
      </div>
      <div className="form-row" style={{ gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <label className="btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          Выбрать файл
          <input
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
            onChange={(e) => {
              onFile(e.target.files?.[0] ?? null, 'file')
              e.target.value = ''
            }}
          />
        </label>
        <label className="btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          Фото
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              onFile(e.target.files?.[0] ?? null, 'image')
              e.target.value = ''
            }}
          />
        </label>
        <label className="btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          Презентация
          <input
            type="file"
            hidden
            accept=".ppt,.pptx,.pdf"
            onChange={(e) => {
              onFile(e.target.files?.[0] ?? null, 'presentation')
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </div>
  )
}
