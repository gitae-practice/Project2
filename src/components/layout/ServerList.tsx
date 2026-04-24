import { Plus, MessageCircle } from 'lucide-react'
import type { Server } from '../../types'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  servers: Server[]
  currentServer: Server | null
  onSelectServer: (server: Server | null) => void
  onCreateServer: () => void
}

function ServerIcon({ server, active, onClick }: { server: Server; active: boolean; onClick: () => void }) {
  const initials = server.name.slice(0, 2).toUpperCase()
  return (
    <div className="relative group flex items-center mb-2">
      <div
        className={`absolute left-0 w-1 rounded-r-full bg-white transition-all duration-200 ${
          active ? 'h-9' : 'h-4 opacity-0 group-hover:opacity-100 group-hover:h-5'
        }`}
      />
      <button
        onClick={onClick}
        className={`ml-3 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-200 group-hover:rounded-xl ${
          active
            ? 'bg-discord-accent text-white rounded-xl'
            : 'bg-discord-700 text-discord-200 hover:bg-discord-accent hover:text-white'
        }`}
        title={server.name}
      >
        {server.icon_url ? (
          <img src={server.icon_url} alt={server.name} className="w-full h-full rounded-inherit object-cover" />
        ) : (
          initials
        )}
      </button>
    </div>
  )
}

export default function ServerList({ servers, currentServer, onSelectServer, onCreateServer }: Props) {
  const profile = useAuthStore((s) => s.profile)

  return (
    <div className="w-[72px] bg-discord-900 flex flex-col items-center py-3 overflow-y-auto flex-shrink-0">
      {/* DM Button */}
      <div className="relative group flex items-center mb-2">
        <div
          className={`absolute left-0 w-1 rounded-r-full bg-white transition-all duration-200 ${
            !currentServer ? 'h-9' : 'h-4 opacity-0 group-hover:opacity-100 group-hover:h-5'
          }`}
        />
        <button
          onClick={() => onSelectServer(null)}
          className={`ml-3 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:rounded-xl ${
            !currentServer
              ? 'bg-discord-accent text-white rounded-xl'
              : 'bg-discord-700 text-discord-300 hover:bg-discord-accent hover:text-white'
          }`}
          title="다이렉트 메시지"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-discord-700 rounded-full mb-2" />

      {servers.map((server) => (
        <ServerIcon
          key={server.id}
          server={server}
          active={currentServer?.id === server.id}
          onClick={() => onSelectServer(server)}
        />
      ))}

      <div className="w-8 h-[2px] bg-discord-700 rounded-full my-2" />

      {/* Add Server */}
      <div className="relative group flex items-center mb-2">
        <button
          onClick={onCreateServer}
          className="ml-3 w-12 h-12 rounded-2xl bg-discord-700 text-discord-green flex items-center justify-center transition-all duration-200 group-hover:rounded-xl group-hover:bg-discord-green group-hover:text-white"
          title="서버 추가"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-auto">
        <div className="relative group flex items-center mb-2">
          <button className="ml-3 w-12 h-12 rounded-2xl bg-discord-700 text-discord-300 flex items-center justify-center transition-all duration-200 group-hover:rounded-xl hover:bg-discord-500 hover:text-white" title="프로필">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="avatar" />
            ) : (
              <span className="text-sm font-bold">{profile?.username?.slice(0, 2).toUpperCase() ?? '?'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
