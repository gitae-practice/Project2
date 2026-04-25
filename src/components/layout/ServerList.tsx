import { Plus, MessageCircle } from 'lucide-react'
import type { Server } from '../../types'

interface Props {
  servers: Server[]
  currentServer: Server | null
  unreadDMCount: number
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

export default function ServerList({ servers, currentServer, unreadDMCount, onSelectServer, onCreateServer }: Props) {
  return (
    <div className="w-[72px] bg-discord-900 flex flex-col items-center py-3 overflow-y-auto flex-shrink-0">
      {/* DM Button */}
      <div className="relative group flex items-center mb-2">
        <div
          className={`absolute left-0 w-1 rounded-r-full bg-white transition-all duration-200 ${
            !currentServer ? 'h-9' : 'h-4 opacity-0 group-hover:opacity-100 group-hover:h-5'
          }`}
        />
        <div className="relative ml-3">
          <button
            onClick={() => onSelectServer(null)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:rounded-xl ${
              !currentServer
                ? 'bg-discord-accent text-white rounded-xl'
                : 'bg-discord-700 text-discord-300 hover:bg-discord-accent hover:text-white'
            }`}
            title="다이렉트 메시지"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          {unreadDMCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none">
              {unreadDMCount > 99 ? '99+' : unreadDMCount}
            </span>
          )}
        </div>
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

    </div>
  )
}
