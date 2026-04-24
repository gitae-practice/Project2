import { useState, type KeyboardEvent } from 'react'
import { Send, PlusCircle } from 'lucide-react'

interface Props {
  placeholder: string
  onSend: (content: string) => void
}

export default function MessageInput({ placeholder, onSend }: Props) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="bg-discord-600 rounded-xl flex items-end gap-2 px-4 py-3">
        <button className="text-discord-400 hover:text-discord-200 transition-colors flex-shrink-0 mb-0.5">
          <PlusCircle className="w-5 h-5" />
        </button>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-discord-100 placeholder-discord-400 text-sm outline-none resize-none max-h-40 leading-relaxed"
          style={{ scrollbarWidth: 'none' }}
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="text-discord-400 hover:text-discord-accent disabled:opacity-30 transition-colors flex-shrink-0 mb-0.5"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-[11px] text-discord-400 mt-1 px-1">
        <kbd className="bg-discord-600 px-1 rounded text-[10px]">Enter</kbd> 로 전송, <kbd className="bg-discord-600 px-1 rounded text-[10px]">Shift+Enter</kbd> 로 줄바꿈
      </p>
    </div>
  )
}
