import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { DirectMessage, Profile } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useMessageStore } from '../../stores/messageStore'
import { supabase } from '../../lib/supabase'
import MessageInput from '../chat/MessageInput'
import InviteCard from './InviteCard'
import { isImageUrl } from '../chat/Message'

function extractInviteCode(content: string): string | null {
  const match = content.match(/\/invite\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

interface Props {
  partner: Profile | null
}

export default function DMArea({ partner }: Props) {
  const { user, profile } = useAuthStore()
  const { dmMessages, setDMMessages, addDMMessage, editDMMessage, removeDMMessage } = useMessageStore()
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
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'direct_messages',
      }, (payload) => {
        editDMMessage(payload.new.id, payload.new.content)
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'direct_messages',
      }, (payload) => {
        if (payload.old.id) removeDMMessage(payload.old.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [partner?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 900)
    return () => clearTimeout(t)
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

  const handleEditDM = async (id: string, content: string) => {
    editDMMessage(id, content)
    await supabase.from('direct_messages').update({ content }).eq('id', id)
  }

  const handleDeleteDM = async (id: string) => {
    removeDMMessage(id)
    await supabase.from('direct_messages').delete().eq('id', id)
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
          {partner.username.slice(1).toUpperCase()}
        </div>
        <span className="font-semibold text-white">{partner.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {dmMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full bg-discord-accent flex items-center justify-center text-2xl font-bold text-white mb-4">
              {partner.username.slice(1).toUpperCase()}
            </div>
            <h3 className="text-white font-bold text-xl mb-1">{partner.username}</h3>
            <p className="text-discord-300 text-sm"><strong>{partner.username}</strong>님과의 다이렉트 메시지 시작이에요.</p>
          </div>
        )}
        {dmMessages.map((msg, i) => {
          const prev = dmMessages[i - 1]
          const isConsecutive = !!prev && prev.sender_id === msg.sender_id &&
            new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000
          const isSelf = msg.sender_id === user?.id
          const senderName = isSelf ? (profile?.username ?? '나') : partner.username
          return (
            <DMMessageItem
              key={msg.id}
              message={msg}
              senderName={senderName}
              isConsecutive={isConsecutive}
              isSelf={isSelf}
              onEdit={handleEditDM}
              onDelete={handleDeleteDM}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput placeholder={`Message ${partner.username}`} onSend={handleSend} />
    </div>
  )
}

function DMMessageItem({ message, senderName, isConsecutive, isSelf, onEdit, onDelete }: {
  message: DirectMessage
  senderName: string
  isConsecutive: boolean
  isSelf: boolean
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const time = format(new Date(message.created_at), 'h:mm a')
  const initials = senderName.slice(1).toUpperCase()
  const isImage = isImageUrl(message.content)
  const inviteCode = !editing ? extractInviteCode(message.content) : null

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

  const contentEl = editing ? (
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
  ) : isImage ? (
    <img src={message.content} alt="첨부 이미지" className="max-w-xs max-h-64 rounded-lg mt-1 object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(message.content, '_blank')} />
  ) : (
    <p className="text-discord-200 text-sm leading-relaxed break-words">{message.content}</p>
  )

  const toolbar = isSelf && !editing && (
    <div className="opacity-0 group-hover:opacity-100 absolute -top-3 right-4 flex bg-discord-800 border border-discord-600/50 rounded-md shadow-lg z-10">
      {!isImage && (
        <button onClick={startEdit} className="p-1.5 text-discord-400 hover:text-white hover:bg-discord-700 rounded-l-md transition-colors" title="수정">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={() => onDelete(message.id)} className={`p-1.5 text-discord-400 hover:text-red-400 hover:bg-discord-700 transition-colors ${!isImage ? 'rounded-r-md' : 'rounded-md'}`} title="삭제">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  if (isConsecutive) {
    return (
      <div className="relative flex items-start gap-4 px-4 py-0.5 hover:bg-white/[0.02] group">
        <div className="w-10 flex-shrink-0 flex justify-center pt-1">
          <span className="text-[10px] text-discord-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.created_at), 'h:mm')}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {contentEl}
          {inviteCode && <InviteCard code={inviteCode} />}
        </div>
        {toolbar}
      </div>
    )
  }

  return (
    <div className="relative flex items-start gap-4 px-4 py-1 hover:bg-white/[0.02] group mt-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isSelf ? 'bg-discord-green' : 'bg-discord-accent'}`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white text-sm">{senderName}</span>
          <span className="text-[10px] text-discord-400">{time}</span>
        </div>
        {contentEl}
        {inviteCode && <InviteCard code={inviteCode} />}
      </div>
      {toolbar}
    </div>
  )
}
