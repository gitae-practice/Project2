import { useState } from 'react'
import { X, Hash, Volume2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useServerStore } from '../../stores/serverStore'
import { useToastStore } from '../../stores/toastStore'

interface Props {
  onClose: () => void
}

export default function CreateChannelModal({ onClose }: Props) {
  const { currentServer, addChannel } = useServerStore()
  const { show } = useToastStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<'text' | 'announcement'>('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentServer || !name.trim()) return
    setLoading(true)
    setError(null)

    const slugName = name.trim().toLowerCase().replace(/\s+/g, '-')

    const { data: channel, error: channelErr } = await supabase
      .from('channels')
      .insert({ server_id: currentServer.id, name: slugName, type })
      .select()
      .single()

    if (channelErr || !channel) {
      setError('채널 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
      return
    }

    addChannel(channel)
    show(`'#${channel.name}' 채널이 생성되었습니다!`, 'success')
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white">채널 만들기</h2>
            <button onClick={onClose} className="text-discord-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-discord-300 text-sm mb-6">서버: <span className="font-semibold text-white">{currentServer?.name}</span></p>

          {error && (
            <div className="bg-discord-red/20 border border-discord-red/40 text-discord-red rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                채널 유형
              </label>
              <div className="space-y-2">
                {(['text', 'announcement'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      type === t
                        ? 'border-discord-accent bg-discord-accent/10'
                        : 'border-discord-700 bg-discord-900 hover:border-discord-500'
                    }`}
                  >
                    {t === 'text' ? <Hash className="w-5 h-5 text-discord-300" /> : <Volume2 className="w-5 h-5 text-discord-300" />}
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{t === 'text' ? '텍스트' : '공지'}</p>
                      <p className="text-discord-400 text-xs">{t === 'text' ? '메시지와 파일을 전송하세요' : '공지사항 전용 채널'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                채널 이름 <span className="text-discord-red">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-discord-400">
                  {type === 'text' ? <Hash className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="새-채널"
                  className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 bg-discord-700 hover:bg-discord-600 text-discord-200 font-semibold py-3 rounded-lg transition-colors">
                취소
              </button>
              <button type="submit" disabled={loading || !name.trim()} className="flex-1 bg-discord-accent hover:bg-discord-accent-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
                {loading ? '생성 중...' : '채널 만들기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
