import type { Attachment } from '../types'
import { Icon } from './Icon'

const kindLabels: Record<Attachment['kind'], string> = {
  link: 'Ссылка',
  file: 'Файл',
  image: 'Фото',
  presentation: 'Презентация',
}

export function AttachmentFile({
  name,
  label,
  kind,
  url,
}: {
  name: string
  label?: string
  kind?: Attachment['kind']
  url?: string
}) {
  const content = (
    <>
      <Icon name="paperclip" size={16} />
      <span>
        {(label || (kind ? kindLabels[kind] : undefined)) && (
          <strong>{label ?? (kind ? kindLabels[kind] : '')}: </strong>
        )}
        {name}
      </span>
    </>
  )

  if (url) {
    return (
      <a className="attachment-file" href={url} target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }

  return <div className="attachment-file">{content}</div>
}

export function AttachmentList({ items }: { items?: Attachment[] }) {
  if (!items?.length) return null
  return (
    <div className="attachment-list">
      {items.map((a) => (
        <AttachmentFile key={a.id} name={a.name} kind={a.kind} url={a.url} />
      ))}
    </div>
  )
}
