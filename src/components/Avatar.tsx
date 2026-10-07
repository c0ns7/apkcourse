import { getInitials } from '../utils/helpers'

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  )
}
