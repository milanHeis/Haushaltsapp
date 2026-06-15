interface Props {
  options: string[]
  value: string
  onChange: (v: string) => void
}

export default function EmojiPicker({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
            value === e
              ? 'ring-2 ring-indigo-500 bg-indigo-500/20 scale-110'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
