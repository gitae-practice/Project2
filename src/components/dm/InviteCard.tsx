import { useState, useEffect } from 'react'
import { Users, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useServerStore } from '../../stores/serverStore'
import { useMessageStore } from '../../stores/messageStore'
import { useToastStore } from '../../stores/toastStore'
import type { Server } from '../../types'

interface Props {
  code: string
  onJoined?: () => void
}

interface ServerInfo {
  id: string
  name: string
  icon_url: string | null
  member_count: number
}

export default function InviteCard({ code, onJoined }: Props) {
  const { user } = useAuthStore()
  const { setServers, setCurrentServer } = useServerStore()
  const { setCurrentDMPartner } = useMessageStore()
  const { show } = useToastStore()

  const [info, setInfo] = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [isAlreadyMember, setIsAlreadyMember] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const fetchInfo = async () => {
      const { data } = await supabase.rpc('get_server_by_invite_code', { invite_code: code })
      if (!data || data.length === 0) {
        setInvalid(true)
        setLoading(false)
        return
      }
      const serverInfo = data[0]
      setInfo(serverInfo)

      if (user) {
        const { data: existing } = await supabase
          .from('server_members')
          .select('user_id')
          .eq('server_id', serverInfo.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setIsAlreadyMember(!!existing)
      }
      setLoading(false)
    }
    fetchInfo()
  }, [code, user?.id])

  const handleAction = async () => {
    if (!user || !info) return

    const navigate = async () => {
      const { data: memberData } = await supabase
        .from('server_members')
        .select('server_id, servers(*)')
        .eq('user_id', user.id)
      if (memberData) {
        const servers = memberData.map((d: any) => d.servers).filter(Boolean) as Server[]
        setServers(servers)
        const target = servers.find((s) => s.id === info.id)
        if (target) { setCurrentServer(target); setCurrentDMPartner(null) }
      }
    }

    if (isAlreadyMember) {
      await navigate()
      onJoined?.()
      return
    }

    setJoining(true)
    await supabase.from('server_members').insert({ server_id: info.id, user_id: user.id, role: 'member' })
    await navigate()
    setIsAlreadyMember(true)
    show('서버에 참가되었습니다!', 'success')
    setJoining(false)
    onJoined?.()
  }

  if (loading) {
    return <div className="mt-2 bg-discord-900 border border-discord-700 rounded-lg w-72 h-20 animate-pulse" />
  }

  if (invalid || !info) {
    return (
      <div className="mt-2 bg-discord-900 border border-discord-700 rounded-lg p-4 w-72">
        <p className="text-xs text-discord-400 uppercase font-semibold mb-2">초대장을 보냈지만...</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-discord-700 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-discord-400" />
          </div>
          <div>
            <p className="text-discord-200 text-sm font-semibold">올바르지 않은 초대장</p>
            <p className="text-discord-400 text-xs">새 초대장을 보내 보세요!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 bg-discord-900 border border-discord-700 rounded-lg p-4 w-72">
      <p className="text-xs text-discord-400 uppercase font-semibold mb-3">서버에 초대되었어요</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {info.icon_url ? (
            <img src={info.icon_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={info.name} />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-discord-accent flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
              {info.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold truncate">{info.name}</p>
            <p className="text-discord-400 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              멤버 {info.member_count}명
            </p>
          </div>
        </div>
        <button
          onClick={handleAction}
          disabled={joining}
          className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0 ${
            isAlreadyMember
              ? 'bg-discord-700 hover:bg-discord-600 text-discord-200'
              : 'bg-discord-accent hover:bg-discord-accent-hover text-white'
          }`}
        >
          {joining ? '...' : isAlreadyMember ? '방문' : '참가'}
        </button>
      </div>
    </div>
  )
}
