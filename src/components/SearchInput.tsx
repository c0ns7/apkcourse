import { Icon } from './Icon'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="search-bar">
      <Icon name="search" size={18} className="search-bar-icon" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
