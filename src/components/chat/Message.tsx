import { useRef, useState, type KeyboardEvent } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import type { Message as MessageType } from '../../types'

export function isImageUrl(content: string): boolean {
  if (!content.startsWith('https://')) return false
  try {
    const url = new URL(content)
    return /\.(jpg|jpeg|png|gif|webp|svg|heic|bmp)(\?.*)?$/i.test(url.pathname)
  } catch {
    return false
  }
}

function ImageMessage({ src }: { src: string }) {
  const [retryKey, setRetryKey] = useState(0)
  const retryCount = useRef(0)
  return (
    <img
      key={retryKey}
      src={src}
      alt="첨부 이미지"
      className="max-w-xs max-h-64 rounded-lg mt-1 object-contain cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => window.open(src, '_blank')}
      onError={() => {
        if (retryCount.current < 4) {
          retryCount.current++
          setTimeout(() => setRetryKey((k) => k + 1), 800)
        }
      }}
    />
  )
}

function MessageContent({ content }: { content: string }) {
  if (isImageUrl(content)) return <ImageMessage src={content} />
  return <p className="text-discord-200 text-sm leading-relaxed break-words">{content}</p>
}

function MessageToolbar({ onEdit, onDelete, showEdit }: { onEdit: () => void; onDelete: () => void; showEdit: boolean }) {
  return (
    <div className="opacity-0 group-hover:opacity-100 absolute -top-3 right-4 flex bg-discord-800 border border-discord-600/50 rounded-md shadow-lg z-10">
      {showEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-discord-400 hover:text-white hover:bg-discord-700 rounded-l-md transition-colors"
          title="수정"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={onDelete}
        className={`p-1.5 text-discord-400 hover:text-red-400 hover:bg-discord-700 transition-colors ${showEdit ? 'rounded-r-md' : 'rounded-md'}`}
        title="삭제"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

interface Props {
  message: MessageType
  isConsecutive: boolean
  isOwn: boolean
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}

export default function MessageItem({ message, isConsecutive, isOwn, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)

  const username = message.profile?.username ?? 'Unknown'
  const initials = username.slice(1).toUpperCase()
  const time = format(new Date(message.created_at), 'h:mm a')
  const fullDate = format(new Date(message.created_at), 'MMM d, yyyy h:mm a')
  const isImage = isImageUrl(message.content)

  const startEdit = () => { setEditValue(message.content); setEditing(true) }
  const cancelEdit = () => { setEditValue(message.content); setEditing(false) }
  const saveEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== message.content) onEdit(message.id, trimmed)
    setEditing(false)
  }
  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  const editArea = editing ? (
    <div className="mt-1">
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleEditKeyDown}
        autoFocus
        rows={2}
        className="w-full bg-discord-900 text-discord-100 text-sm rounded-md p-2 outline-none resize-none border border-discord-accent/50"
      />
      <p className="text-[11px] text-discord-400 mt-0.5">
        <kbd className="bg-discord-600 px-1 rounded text-[10px]">Enter</kbd> 저장,{' '}
        <kbd className="bg-discord-600 px-1 rounded text-[10px]">Esc</kbd> 취소 ·{' '}
        <button onClick={saveEdit} className="text-discord-accent hover:underline">저장</button>{' '}·{' '}
        <button onClick={cancelEdit} className="hover:underline">취소</button>
      </p>
    </div>
  ) : (
    <MessageContent content={message.content} />
  )

  if (isConsecutive) {
    return (
      <div className="relative flex items-start gap-4 px-4 py-0.5 hover:bg-white/[0.02] group">
        <div className="w-10 flex-shrink-0 flex justify-center pt-1">
          <span className="text-[10px] text-discord-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.created_at), 'h:mm')}
          </span>
        </div>
        <div className="min-w-0 flex-1">{editArea}</div>
        {isOwn && !editing && (
          <MessageToolbar onEdit={startEdit} onDelete={() => onDelete(message.id)} showEdit={!isImage} />
        )}
      </div>
    )
  }

  return (
    <div className="relative flex items-start gap-4 px-4 py-1 hover:bg-white/[0.02] group mt-2">
      <div className="w-10 h-10 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white text-sm">{username}</span>
          <span className="text-[10px] text-discord-400" title={fullDate}>{time}</span>
          {message.is_edited && !editing && <span className="text-[10px] text-discord-400">(edited)</span>}
        </div>
        {editArea}
      </div>
      {isOwn && !editing && (
        <MessageToolbar onEdit={startEdit} onDelete={() => onDelete(message.id)} showEdit={!isImage} />
      )}
    </div>
  )
}
