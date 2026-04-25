import type { ServerMember } from '../../types'

interface Props {
  members: ServerMember[]
}

export default function MemberList({ members }: Props) {
  const online = members
  const offline: ServerMember[] = []

  return (
    <div className="w-60 bg-discord-800 flex-shrink-0 overflow-y-auto py-4">
      {online.length > 0 && (
        <div className="mb-4">
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-2">
            멤버 — {online.length}
          </p>
          {online.map((m) => (
            <MemberItem key={m.user_id} member={m} isOnline />
          ))}
        </div>
      )}
      {offline.length > 0 && (
        <div>
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-2">
            오프라인 — {offline.length}
          </p>
          {offline.map((m) => (
            <MemberItem key={m.user_id} member={m} isOnline={false} />
          ))}
        </div>
      )}
    </div>
  )
}

function MemberItem({ member, isOnline }: { member: ServerMember; isOnline: boolean }) {
  const username = member.profile?.username ?? 'Unknown'
  const initials = username.slice(1).toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 mx-2 rounded-md hover:bg-discord-700 cursor-pointer transition-colors group">
      <div className="relative flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isOnline ? 'bg-discord-accent' : 'bg-discord-500 opacity-60'}`}>
          {initials}
        </div>
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-800 ${
            isOnline ? 'bg-discord-green' : 'bg-discord-400'
          }`}
        />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${isOnline ? 'text-discord-200 group-hover:text-white' : 'text-discord-400'}`}>
          {username}
        </p>
        {member.role !== 'member' && (
          <p className="text-xs text-discord-accent">{{ owner: '소유자', admin: '관리자', member: '멤버' }[member.role]}</p>
        )}
      </div>
    </div>
  )
}
