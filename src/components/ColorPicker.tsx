import { ROOM_COLORS } from '../types'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROOM_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all ${value === c ? 'ring-2 ring-white scale-125' : 'hover:scale-110'}`}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}
