import { Hash, Volume2, Plus, LogOut, ChevronDown, UserPlus } from 'lucide-react'
import type { Server, Channel } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { supabase } from '../../lib/supabase'

interface Props {
  server: Server | null
  channels: Channel[]
  currentChannel: Channel | null
  onSelectChannel: (channel: Channel) => void
  onCreateChannel: () => void
  onInvite: () => void
}

export default function ChannelList({ server, channels, currentChannel, onSelectChannel, onCreateChannel, onInvite }: Props) {
  const { profile, reset } = useAuthStore()
  const { show } = useToastStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    show('로그아웃되었습니다.', 'info')
  }

  if (!server) return null

  const textChannels = channels.filter((c) => c.type === 'text')
  const announcementChannels = channels.filter((c) => c.type === 'announcement')

  return (
    <div className="w-60 bg-discord-800 flex flex-col flex-shrink-0">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-discord-900 shadow-sm cursor-pointer hover:bg-discord-700 transition-colors">
        <span className="font-semibold text-white truncate flex-1">{server.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onInvite() }}
            className="text-discord-300 hover:text-white transition-colors p-1"
            title="초대 링크 만들기"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <ChevronDown className="w-4 h-4 text-discord-300 flex-shrink-0" />
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {announcementChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 mb-1 group">
              <span className="text-xs font-semibold uppercase tracking-wide text-discord-400 group-hover:text-discord-200 transition-colors">
                공지 채널
              </span>
              <button
                onClick={onCreateChannel}
                className="opacity-0 group-hover:opacity-100 text-discord-400 hover:text-discord-100 transition-all"
                title="채널 만들기"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {announcementChannels.map((ch) => (
              <ChannelItem key={ch.id} channel={ch} active={currentChannel?.id === ch.id} onClick={() => onSelectChannel(ch)} />
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between px-4 mb-1 group">
            <span className="text-xs font-semibold uppercase tracking-wide text-discord-400 group-hover:text-discord-200 transition-colors">
              텍스트 채널
            </span>
            <button
              onClick={onCreateChannel}
              className="opacity-0 group-hover:opacity-100 text-discord-400 hover:text-discord-100 transition-all"
              title="채널 만들기"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {textChannels.map((ch) => (
            <ChannelItem key={ch.id} channel={ch} active={currentChannel?.id === ch.id} onClick={() => onSelectChannel(ch)} />
          ))}
          {textChannels.length === 0 && (
            <p className="px-4 text-xs text-discord-400 italic">채널이 없습니다</p>
          )}
        </div>

        {/* 채널 추가 버튼 */}
        <div className="px-3">
          <button
            onClick={onCreateChannel}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-discord-700 hover:bg-discord-600 text-discord-300 hover:text-white transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            채널 추가
          </button>
        </div>
      </div>

      {/* User Panel */}
      <div className="h-14 bg-discord-900 px-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {profile?.username?.slice(-2).toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{profile?.username}</p>
          <p className="text-xs text-discord-green flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-discord-green inline-block" />
            온라인
          </p>
        </div>
        <button onClick={handleLogout} className="text-discord-400 hover:text-discord-red transition-colors p-1" title="로그아웃">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ChannelItem({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 mx-2 py-1.5 rounded-md text-sm transition-colors group ${
        active
          ? 'bg-discord-600 text-white'
          : 'text-discord-400 hover:bg-discord-700 hover:text-discord-200'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      {channel.type === 'announcement' ? (
        <Volume2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Hash className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="truncate">{channel.name}</span>
    </button>
  )
}
