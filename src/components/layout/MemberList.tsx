import { useEffect, useState } from 'react'
import { UserX, UserPlus, MessageCircle } from 'lucide-react'
import type { ServerMember } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { supabase } from '../../lib/supabase'

interface Props {
  members: ServerMember[]
  onlineUserIds: Set<string>
  currentUserId: string
  isOwner: boolean
  onKick: (userId: string) => void
  onOpenDM: (member: ServerMember) => void
}

export default function MemberList({ members, onlineUserIds, currentUserId, isOwner, onKick, onOpenDM }: Props) {
  const { user } = useAuthStore()
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .then(({ data }) => {
        if (!data) return
        const ids = new Set(data.map((r: any) => r.sender_id === user.id ? r.receiver_id : r.sender_id))
        setFriendIds(ids)
      })
  }, [user?.id])

  const online = members.filter((m) => onlineUserIds.has(m.user_id))
  const offline = members.filter((m) => !onlineUserIds.has(m.user_id))

  return (
    <div className="w-60 bg-discord-800 flex-shrink-0 overflow-y-auto py-4">
      {online.length > 0 && (
        <div className="mb-4">
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-2">
            온라인 — {online.length}
          </p>
          {online.map((m) => (
            <MemberItem
              key={m.user_id}
              member={m}
              isOnline
              canKick={isOwner && m.user_id !== currentUserId && m.role !== 'owner'}
              isFriend={friendIds.has(m.user_id)}
              isSelf={m.user_id === currentUserId}
              onKick={onKick}
              onAddFriend={(id) => { setFriendIds((prev) => new Set([...prev, id])) }}
              onOpenDM={() => onOpenDM(m)}
            />
          ))}
        </div>
      )}
      {offline.length > 0 && (
        <div>
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-2">
            오프라인 — {offline.length}
          </p>
          {offline.map((m) => (
            <MemberItem
              key={m.user_id}
              member={m}
              isOnline={false}
              canKick={isOwner && m.user_id !== currentUserId && m.role !== 'owner'}
              isFriend={friendIds.has(m.user_id)}
              isSelf={m.user_id === currentUserId}
              onKick={onKick}
              onAddFriend={(id) => { setFriendIds((prev) => new Set([...prev, id])) }}
              onOpenDM={() => onOpenDM(m)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MemberItem({ member, isOnline, canKick, isFriend, isSelf, onKick, onAddFriend, onOpenDM }: {
  member: ServerMember
  isOnline: boolean
  canKick: boolean
  isFriend: boolean
  isSelf: boolean
  onKick: (userId: string) => void
  onAddFriend: (userId: string) => void
  onOpenDM: () => void
}) {
  const { user } = useAuthStore()
  const { show } = useToastStore()
  const username = member.profile?.username ?? 'Unknown'
  const initials = username.slice(1).toUpperCase()

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: member.user_id,
      status: 'pending',
    })
    if (!error) {
      show(`${username}님에게 친구 요청을 보냈습니다.`, 'success')
      onAddFriend(member.user_id)
    } else {
      show('이미 친구 요청을 보냈습니다.', 'info')
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 mx-2 rounded-md hover:bg-discord-700 cursor-pointer transition-colors group"
      onClick={isSelf ? undefined : onOpenDM}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isOnline ? 'bg-discord-accent' : 'bg-discord-500 opacity-60'}`}>
          {initials}
        </div>
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-800 ${isOnline ? 'bg-discord-green' : 'bg-discord-400'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${isOnline ? 'text-discord-200 group-hover:text-white' : 'text-discord-400'}`}>
          {username}
        </p>
        {member.role !== 'member' && (
          <p className="text-xs text-discord-accent">{{ owner: '소유자', admin: '관리자', member: '멤버' }[member.role]}</p>
        )}
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        {!isSelf && !isFriend && (
          <button
            onClick={handleAddFriend}
            className="text-discord-400 hover:text-discord-green transition-colors p-1"
            title="친구 추가"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        )}
        {!isSelf && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDM() }}
            className="text-discord-400 hover:text-white transition-colors p-1"
            title="개인 메시지"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
        )}
        {canKick && (
          <button
            onClick={(e) => { e.stopPropagation(); onKick(member.user_id) }}
            className="text-discord-400 hover:text-red-400 transition-colors p-1"
            title="강퇴"
          >
            <UserX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
