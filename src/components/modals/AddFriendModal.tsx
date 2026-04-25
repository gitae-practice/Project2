import { useState } from 'react'
import { X, Search, UserPlus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import type { Profile } from '../../types'

interface Props {
  onClose: () => void
}

export default function AddFriendModal({ onClose }: Props) {
  const { user } = useAuthStore()
  const { show } = useToastStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [sent, setSent] = useState<Record<string, boolean>>({})

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (!value.trim()) { setResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${value.trim()}%`)
      .neq('id', user?.id)
      .limit(8)
    if (data) setResults(data as Profile[])
  }

  const handleSendRequest = async (target: Profile) => {
    if (!user) return
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: target.id,
      status: 'pending',
    })
    if (error) {
      show('이미 친구 요청을 보냈거나 친구입니다.', 'error')
      return
    }
    setSent((prev) => ({ ...prev, [target.id]: true }))
    show(`${target.username}님에게 친구 요청을 보냈습니다!`, 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">친구 추가</h2>
            <button onClick={onClose} className="text-discord-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-400" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="이름으로 검색"
              autoFocus
              className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
            />
          </div>

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-discord-700 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-discord-accent flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {p.username.slice(1).toUpperCase()}
                  </div>
                  <span className="flex-1 text-discord-100 text-sm font-medium">{p.username}</span>
                  <button
                    onClick={() => handleSendRequest(p)}
                    disabled={sent[p.id]}
                    className="flex items-center gap-1.5 bg-discord-accent hover:bg-discord-accent-hover disabled:bg-discord-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                  >
                    {sent[p.id] ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {sent[p.id] ? '전송됨' : '요청'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <p className="text-discord-400 text-sm text-center py-4">검색 결과가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
