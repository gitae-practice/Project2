import { useRef, useState } from 'react'
import { format } from 'date-fns'
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

interface Props {
  message: MessageType
  isConsecutive: boolean
}

export default function MessageItem({ message, isConsecutive }: Props) {
  const username = message.profile?.username ?? 'Unknown'
  const initials = username.slice(1).toUpperCase()
  const time = format(new Date(message.created_at), 'h:mm a')
  const fullDate = format(new Date(message.created_at), 'MMM d, yyyy h:mm a')

  if (isConsecutive) {
    return (
      <div className="flex items-start gap-4 px-4 py-0.5 hover:bg-white/[0.02] group">
        <div className="w-10 flex-shrink-0 flex justify-center pt-1">
          <span className="text-[10px] text-discord-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.created_at), 'h:mm')}
          </span>
        </div>
        <div className="min-w-0">
          <MessageContent content={message.content} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 px-4 py-1 hover:bg-white/[0.02] group mt-2">
      <div className="w-10 h-10 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white text-sm">{username}</span>
          <span className="text-[10px] text-discord-400" title={fullDate}>{time}</span>
          {message.is_edited && <span className="text-[10px] text-discord-400">(edited)</span>}
        </div>
        <MessageContent content={message.content} />
      </div>
    </div>
  )
}
