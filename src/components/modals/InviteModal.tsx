import { useState, useEffect } from 'react'
import { X, Copy, Check, Link, Search, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import type { Server, Profile } from '../../types'

interface Props {
  server: Server
  onClose: () => void
}

export default function InviteModal({ server, onClose }: Props) {
  const { user } = useAuthStore()
  const { show } = useToastStore()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [sent, setSent] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchOrCreate = async () => {
      if (!user) return
      const { data: existing } = await supabase
        .from('server_invites')
        .select('code')
        .eq('server_id', server.id)
        .eq('created_by', user.id)
        .maybeSingle()
      if (existing) { setCode(existing.code); setLoading(false); return }
      const newCode = Math.random().toString(36).substring(2, 10)
      const { data } = await supabase
        .from('server_invites')
        .insert({ server_id: server.id, code: newCode, created_by: user.id })
        .select('code')
        .single()
      if (data) setCode(data.code)
      setLoading(false)
    }
    fetchOrCreate()
  }, [server.id, user?.id])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query.trim()}%`)
        .neq('id', user?.id)
        .limit(5)
      if (data) setResults(data as Profile[])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const inviteUrl = code ? `${window.location.origin}/invite/${code}` : ''

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    show('초대 링크가 복사되었습니다!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendDM = async (target: Profile) => {
    if (!user || !inviteUrl) return
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: target.id,
      content: inviteUrl,
    })
    setSent((prev) => ({ ...prev, [target.id]: true }))
    show(`${target.username}님에게 초대장을 보냈습니다!`, 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white">친구 초대하기</h2>
            <button onClick={onClose} className="text-discord-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-discord-300 text-sm mb-5">
            <span className="font-semibold text-white">{server.name}</span> 서버에 초대할 친구를 검색하세요.
          </p>

          {/* 유저 검색 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름으로 검색"
              className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
            />
          </div>

          {results.length > 0 && (
            <div className="bg-discord-900 rounded-lg overflow-hidden mb-4">
              {results.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-discord-700 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {p.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 text-discord-200 text-sm font-medium">{p.username}</span>
                  <button
                    onClick={() => handleSendDM(p)}
                    disabled={sent[p.id]}
                    className="flex items-center gap-1.5 bg-discord-accent hover:bg-discord-accent-hover disabled:bg-discord-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-60"
                  >
                    <Send className="w-3 h-3" />
                    {sent[p.id] ? '전송됨' : '초대'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 링크 복사 */}
          <p className="text-xs font-semibold text-discord-400 uppercase tracking-wide mb-2">또는 링크 공유</p>
          <div className="bg-discord-900 rounded-lg p-3 flex items-center gap-2">
            <Link className="w-4 h-4 text-discord-400 flex-shrink-0" />
            <span className="flex-1 text-discord-200 text-sm truncate">
              {loading ? '링크 생성 중...' : inviteUrl}
            </span>
            <button
              onClick={handleCopy}
              disabled={loading || !inviteUrl}
              className="bg-discord-accent hover:bg-discord-accent-hover text-white text-sm font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
