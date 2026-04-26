import { UserX } from 'lucide-react'
import type { ServerMember } from '../../types'

interface Props {
  members: ServerMember[]
  onlineUserIds: Set<string>
  currentUserId: string
  isOwner: boolean
  onKick: (userId: string) => void
}

export default function MemberList({ members, onlineUserIds, currentUserId, isOwner, onKick }: Props) {
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
              onKick={onKick}
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
              onKick={onKick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MemberItem({ member, isOnline, canKick, onKick }: {
  member: ServerMember
  isOnline: boolean
  canKick: boolean
  onKick: (userId: string) => void
}) {
  const username = member.profile?.username ?? 'Unknown'
  const initials = username.slice(1).toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 mx-2 rounded-md hover:bg-discord-700 cursor-pointer transition-colors group">
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
      {canKick && (
        <button
          onClick={(e) => { e.stopPropagation(); onKick(member.user_id) }}
          className="opacity-0 group-hover:opacity-100 text-discord-400 hover:text-red-400 transition-all p-1 flex-shrink-0"
          title="강퇴"
        >
          <UserX className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
