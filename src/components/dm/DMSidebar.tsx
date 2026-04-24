import { useState, useEffect } from 'react'
import { MessageCircle, Search, LogOut, UserPlus, Check, X } from 'lucide-react'
import type { Profile } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { supabase } from '../../lib/supabase'
import AddFriendModal from '../modals/AddFriendModal'

interface PendingRequest {
  id: string
  sender: Profile
}

interface Props {
  conversations: Profile[]
  currentPartner: string | null
  onSelectPartner: (partner: Profile) => void
}

export default function DMSidebar({ conversations, currentPartner, onSelectPartner }: Props) {
  const { user, profile, reset } = useAuthStore()
  const { show } = useToastStore()
  const [friends, setFriends] = useState<Profile[]>([])
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [showAddFriend, setShowAddFriend] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchFriends()
    fetchPending()

    const sub = supabase
      .channel('friend_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        fetchFriends()
        fetchPending()
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

  const fetchFriends = async () => {
    if (!user) return
    const { data } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id, sender:profiles!sender_id(id,username,avatar_url), receiver:profiles!receiver_id(id,username,avatar_url)')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    if (!data) return
    const list = data.map((r: any) =>
      r.sender_id === user.id ? r.receiver : r.sender
    ).filter(Boolean) as Profile[]
    setFriends(list)
  }

  const fetchPending = async () => {
    if (!user) return
    const { data } = await supabase
      .from('friend_requests')
      .select('id, sender:profiles!sender_id(id,username,avatar_url)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
    if (data) setPending(data.map((r: any) => ({ id: r.id, sender: r.sender })).filter((r: any) => r.sender))
  }

  const handleAccept = async (requestId: string, sender: Profile) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId)
    show(`${sender.username}님과 친구가 되었습니다!`, 'success')
  }

  const handleReject = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    show('로그아웃되었습니다.', 'info')
  }

  const dmOnlyPartners = conversations.filter(c => !friends.find(f => f.id === c.id))

  return (
    <div className="w-60 bg-discord-800 flex flex-col flex-shrink-0">
      <div className="h-12 px-3 flex items-center gap-2 border-b border-discord-900 shadow-sm">
        <div className="flex-1 bg-discord-900 rounded-md px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-discord-700 transition-colors">
          <Search className="w-4 h-4 text-discord-400 flex-shrink-0" />
          <span className="text-discord-400 text-sm">DM 찾기</span>
        </div>
        <button
          onClick={() => setShowAddFriend(true)}
          className="text-discord-400 hover:text-white transition-colors p-1"
          title="친구 추가"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {pending.length > 0 && (
          <div>
            <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-1">
              친구 요청 <span className="bg-discord-red text-white text-[10px] rounded-full px-1.5 ml-1">{pending.length}</span>
            </p>
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-2 px-2 mx-2 py-2 rounded-md" style={{ width: 'calc(100% - 16px)' }}>
                <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {req.sender.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 text-discord-200 text-sm truncate">{req.sender.username}</span>
                <button onClick={() => handleAccept(req.id, req.sender)} className="text-discord-green hover:text-white transition-colors p-0.5" title="수락">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => handleReject(req.id)} className="text-discord-400 hover:text-discord-red transition-colors p-0.5" title="거절">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {friends.length > 0 && (
          <div>
            <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-1">
              친구 — {friends.length}
            </p>
            {friends.map((f) => (
              <PartnerButton key={f.id} partner={f} active={currentPartner === f.id} onClick={() => onSelectPartner(f)} />
            ))}
          </div>
        )}

        <div>
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-discord-400 mb-1">다이렉트 메시지</p>
          {dmOnlyPartners.length === 0 && friends.length === 0 && (
            <div className="px-4 text-center py-6">
              <MessageCircle className="w-10 h-10 text-discord-500 mx-auto mb-2" />
              <p className="text-discord-400 text-xs">대화가 없습니다</p>
            </div>
          )}
          {dmOnlyPartners.map((p) => (
            <PartnerButton key={p.id} partner={p} active={currentPartner === p.id} onClick={() => onSelectPartner(p)} />
          ))}
        </div>
      </div>

      <div className="h-14 bg-discord-900 px-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {profile?.username?.slice(0, 2).toUpperCase() ?? '?'}
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

      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
    </div>
  )
}

function PartnerButton({ partner, active, onClick }: { partner: Profile; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 mx-2 py-2 rounded-md transition-colors group ${
        active ? 'bg-discord-600 text-white' : 'text-discord-300 hover:bg-discord-700 hover:text-discord-100'
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
  )
}
