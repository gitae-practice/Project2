import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { DirectMessage, Profile } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useMessageStore } from '../../stores/messageStore'
import { supabase } from '../../lib/supabase'
import MessageInput from '../chat/MessageInput'
import InviteCard from './InviteCard'

function extractInviteCode(content: string): string | null {
  const match = content.match(/\/invite\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

interface Props {
  partner: Profile | null
}

export default function DMArea({ partner }: Props) {
  const { user } = useAuthStore()
  const { dmMessages, setDMMessages, addDMMessage } = useMessageStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!partner || !user) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!sender_id(id, username, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setDMMessages(data as DirectMessage[])
    }

    fetchMessages()

    const channelKey = [user.id, partner.id].sort().join('-')
    const sub = supabase
      .channel(`dm:${channelKey}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: `sender_id=eq.${partner.id}`,
      }, async (payload) => {
        if (payload.new.receiver_id === user.id) {
          const { data } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', payload.new.sender_id).single()
          addDMMessage({ ...payload.new, sender: data } as DirectMessage)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [partner?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dmMessages])

  const handleSend = async (content: string) => {
    if (!partner || !user) return
    const newMsg: DirectMessage = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: partner.id,
      content,
      created_at: new Date().toISOString(),
    }
    addDMMessage(newMsg)
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: partner.id,
      content,
    })
  }

  if (!partner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-discord-700">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-discord-500 mx-auto mb-4" />
          <p className="text-discord-300 text-lg font-medium">친구를 선택해서 대화를 시작하세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-discord-700 min-w-0">
      <div className="h-12 px-4 flex items-center border-b border-discord-900/50 flex-shrink-0 gap-3">
        <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white">
          {partner.username.slice(0, 2).toUpperCase()}
        </div>
        <span className="font-semibold text-white">{partner.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {dmMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full bg-discord-accent flex items-center justify-center text-2xl font-bold text-white mb-4">
              {partner.username.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="text-white font-bold text-xl mb-1">{partner.username}</h3>
            <p className="text-discord-300 text-sm"><strong>{partner.username}</strong>님과의 다이렉트 메시지 시작이에요.</p>
          </div>
        )}
        {dmMessages.map((msg, i) => {
          const prev = dmMessages[i - 1]
          const isConsecutive = !!prev && prev.sender_id === msg.sender_id &&
            new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000
          const senderName = msg.sender_id === user?.id ? 'You' : partner.username
          return (
            <DMMessageItem key={msg.id} message={msg} senderName={senderName} isConsecutive={isConsecutive} isSelf={msg.sender_id === user?.id} />
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput placeholder={`Message ${partner.username}`} onSend={handleSend} />
    </div>
  )
}

function DMMessageItem({ message, senderName, isConsecutive, isSelf }: {
  message: DirectMessage; senderName: string; isConsecutive: boolean; isSelf: boolean
}) {
  const time = format(new Date(message.created_at), 'h:mm a')
  const initials = senderName.slice(0, 2).toUpperCase()

  if (isConsecutive) {
    return (
      <div className="flex items-start gap-4 px-4 py-0.5 hover:bg-white/[0.02] group">
        <div className="w-10 flex-shrink-0 flex justify-center pt-1">
          <span className="text-[10px] text-discord-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.created_at), 'h:mm')}
          </span>
        </div>
        <p className="text-discord-200 text-sm leading-relaxed break-words min-w-0">{message.content}</p>
        {extractInviteCode(message.content) && (
          <InviteCard code={extractInviteCode(message.content)!} />
        )}
      </div>
    )
  }

  const inviteCode = extractInviteCode(message.content)

  return (
    <div className="flex items-start gap-4 px-4 py-1 hover:bg-white/[0.02] group mt-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isSelf ? 'bg-discord-green' : 'bg-discord-accent'}`}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white text-sm">{senderName}</span>
          <span className="text-[10px] text-discord-400">{time}</span>
        </div>
        <p className="text-discord-200 text-sm leading-relaxed break-words">{message.content}</p>
        {inviteCode && <InviteCard code={inviteCode} />}
      </div>
    </div>
  )
}
