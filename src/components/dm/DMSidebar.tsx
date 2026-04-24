import { MessageCircle, Search, LogOut } from 'lucide-react'
import type { Profile } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { supabase } from '../../lib/supabase'

interface Props {
  conversations: Profile[]
  currentPartner: string | null
  onSelectPartner: (partnerId: string) => void
}

export default function DMSidebar({ conversations, currentPartner, onSelectPartner }: Props) {
  const { profile, reset } = useAuthStore()
  const { show } = useToastStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    show('로그아웃되었습니다.', 'info')
  }

  return (
    <div className="w-60 bg-discord-800 flex flex-col flex-shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-discord-900 shadow-sm">
        <div className="w-full bg-discord-900 rounded-md px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-discord-700 transition-colors">
          <Search className="w-4 h-4 text-discord-400 flex-shrink-0" />
          <span className="text-discord-400 text-sm">DM 찾기 또는 시작</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-2">
          다이렉트 메시지
        </p>

        {conversations.length === 0 && (
          <div className="px-4 text-center py-8">
            <MessageCircle className="w-10 h-10 text-discord-500 mx-auto mb-2" />
            <p className="text-discord-400 text-xs">대화가 없습니다</p>
          </div>
        )}

        {conversations.map((partner) => (
          <button
            key={partner.id}
            onClick={() => onSelectPartner(partner.id)}
            className={`w-full flex items-center gap-3 px-2 mx-2 py-2 rounded-md transition-colors group ${
              currentPartner === partner.id
                ? 'bg-discord-600 text-white'
                : 'text-discord-300 hover:bg-discord-700 hover:text-discord-100'
            }`}
            style={{ width: 'calc(100% - 16px)' }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white">
                {partner.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-800 bg-discord-green" />
            </div>
            <span className="text-sm font-medium truncate">{partner.username}</span>
          </button>
        ))}
      </div>

      <div className="h-14 bg-discord-900 px-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {profile?.username?.slice(0, 2).toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{profile?.username}</p>
          <p className="text-xs text-discord-green flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-discord-green inline-block" />
            온라인
          </p>
        </div>
        <button onClick={handleLogout} className="text-discord-400 hover:text-discord-red transition-colors p-1" title="Sign Out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
