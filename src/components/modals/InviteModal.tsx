import { useState, useEffect } from 'react'
import { X, Copy, Check, Link } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import type { Server } from '../../types'

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

  useEffect(() => {
    const fetchOrCreate = async () => {
      if (!user) return

      const { data: existing } = await supabase
        .from('server_invites')
        .select('code')
        .eq('server_id', server.id)
        .eq('created_by', user.id)
        .maybeSingle()

      if (existing) {
        setCode(existing.code)
        setLoading(false)
        return
      }

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

  const inviteUrl = code ? `${window.location.origin}/invite/${code}` : ''

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    show('초대 링크가 복사되었습니다!', 'success')
    setTimeout(() => setCopied(false), 2000)
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
          <p className="text-discord-300 text-sm mb-6">
            <span className="font-semibold text-white">{server.name}</span> 서버에 초대하려면 아래 링크를 공유하세요.
          </p>

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

          <p className="text-xs text-discord-400 mt-3">이 링크는 만료되지 않습니다.</p>
        </div>
      </div>
    </div>
  )
}
