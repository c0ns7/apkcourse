import { Icon } from './Icon'

export function AttachmentFile({ name, label }: { name: string; label?: string }) {
  return (
    <div className="attachment-file">
      <Icon name="paperclip" size={16} />
      <span>
        {label && <strong>{label}: </strong>}
        {name}
      </span>
    </div>
  )
}
