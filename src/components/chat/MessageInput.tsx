import { useRef, useState, type KeyboardEvent } from 'react'
import { Send, PlusCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  placeholder: string
  onSend: (content: string) => void
}

export default function MessageInput({ placeholder, onSend }: Props) {
  const { user } = useAuthStore()
  const [value, setValue] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<{ file: File; objectUrl: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview({ file, objectUrl: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
  }

  const submit = async () => {
    if (!user || uploading) return
    if (!value.trim() && !preview) return

    if (preview) {
      setUploading(true)
      const ext = preview.file.name.split('.').pop() ?? 'png'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('chat-images').upload(path, preview.file)
      if (!error) {
        const { data } = supabase.storage.from('chat-images').getPublicUrl(path)
        onSend(data.publicUrl)
      }
      clearPreview()
      setUploading(false)
    }

    const trimmed = value.trim()
    if (trimmed) {
      onSend(trimmed)
      setValue('')
    }
  }

  return (
    <div className="px-4 pb-6 pt-2">
      {preview && (
        <div className="mb-2 ml-1 relative inline-block">
          <img src={preview.objectUrl} alt="preview" className="max-h-32 rounded-lg border border-discord-500 object-cover" />
          <button
            onClick={clearPreview}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-discord-900 border border-discord-600 rounded-full flex items-center justify-center text-discord-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="bg-discord-600 rounded-xl flex items-end gap-2 px-4 py-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="text-discord-400 hover:text-discord-200 transition-colors flex-shrink-0 mb-0.5"
          title="이미지 첨부"
          disabled={uploading}
        >
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
          disabled={(!value.trim() && !preview) || uploading}
          className="text-discord-400 hover:text-discord-accent disabled:opacity-30 transition-colors flex-shrink-0 mb-0.5"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-discord-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-[11px] text-discord-400 mt-1 px-1">
        <kbd className="bg-discord-600 px-1 rounded text-[10px]">Enter</kbd> 로 전송,{' '}
        <kbd className="bg-discord-600 px-1 rounded text-[10px]">Shift+Enter</kbd> 로 줄바꿈
      </p>
    </div>
  )
}
