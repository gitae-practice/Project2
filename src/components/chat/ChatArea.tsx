import { useEffect, useRef } from 'react'
import { Hash, Users } from 'lucide-react'
import type { Channel, Message } from '../../types'
import MessageItem from './Message'
import MessageInput from './MessageInput'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useMessageStore } from '../../stores/messageStore'

interface Props {
  channel: Channel | null
  onToggleMemberList: () => void
}

export default function ChatArea({ channel, onToggleMemberList }: Props) {
  const { user } = useAuthStore()
  const { messages, setMessages, addMessage } = useMessageStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!channel) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profile:profiles(id, username, avatar_url)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data as Message[])
    }

    fetchMessages()

    const ch = supabase.channel(`room:${channel.id}`)
    channelRef.current = ch

    ch.on('broadcast', { event: 'new_message' }, ({ payload }) => {
      addMessage(payload as Message)
    }).subscribe()

    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [channel?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    if (!channel || !user) return
    const { data } = await supabase
      .from('messages')
      .insert({ channel_id: channel.id, user_id: user.id, content })
      .select('*, profile:profiles(id, username, avatar_url)')
      .single()
    if (data && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: data,
      })
    }
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-discord-700">
        <div className="text-center">
          <Hash className="w-16 h-16 text-discord-500 mx-auto mb-4" />
          <p className="text-discord-300 text-lg font-medium">채널을 선택해서 대화를 시작하세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-discord-700 min-w-0">
      <div className="h-12 px-4 flex items-center justify-between border-b border-discord-900/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-discord-400" />
          <span className="font-semibold text-white">{channel.name}</span>
        </div>
        <button onClick={onToggleMemberList} className="text-discord-400 hover:text-discord-200 transition-colors" title="Toggle Member List">
          <Users className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-discord-600 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-discord-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-1">#{channel.name} 채널에 오신 것을 환영합니다!</h3>
            <p className="text-discord-300 text-sm">#{channel.name} 채널의 첫 번째 메시지예요.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1]
          const isConsecutive = !!prev && prev.user_id === msg.user_id &&
            new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000
          return <MessageItem key={msg.id} message={msg} isConsecutive={isConsecutive} />
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput placeholder={`Message #${channel.name}`} onSend={handleSend} />
    </div>
  )
}
