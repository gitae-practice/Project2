import { useState, useRef } from 'react'
import { X, Server, Camera } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useServerStore } from '../../stores/serverStore'
import { useToastStore } from '../../stores/toastStore'

interface Props {
  onClose: () => void
}

export default function CreateServerModal({ onClose }: Props) {
  const { user } = useAuthStore()
  const { addServer } = useServerStore()
  const { show } = useToastStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('이미지 크기는 2MB 이하여야 합니다.')
      return
    }
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setLoading(true)
    setError(null)

    let iconUrl: string | null = null

    if (iconFile) {
      const ext = iconFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('server-icons')
        .upload(path, iconFile, { upsert: true })

      if (uploadErr) {
        setError('이미지 업로드에 실패했습니다.')
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('server-icons').getPublicUrl(path)
      iconUrl = urlData.publicUrl
    }

    const { data: server, error: serverErr } = await supabase
      .from('servers')
      .insert({ name: name.trim(), description: description.trim() || null, owner_id: user.id, icon_url: iconUrl })
      .select()
      .single()

    if (serverErr || !server) {
      console.error('[server create error]', serverErr)
      setError('서버 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
      return
    }

    await supabase.from('server_members').insert({ server_id: server.id, user_id: user.id, role: 'owner' })
    await supabase.from('channels').insert({ server_id: server.id, name: 'general', type: 'text' })

    addServer(server)
    show(`'${server.name}' 서버가 생성되었습니다!`, 'success')
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white">서버 만들기</h2>
            <button onClick={onClose} className="text-discord-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-discord-300 text-sm mb-6">서버에 이름과 아이콘을 설정해주세요.</p>

          <div className="flex justify-center mb-6">
            <div
              className="relative w-20 h-20 rounded-full cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {iconPreview ? (
                <img src={iconPreview} className="w-20 h-20 rounded-full object-cover" alt="서버 아이콘" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-discord-700 border-2 border-dashed border-discord-400 flex items-center justify-center text-discord-400 group-hover:border-discord-200 group-hover:text-discord-200 transition-colors">
                  <Server className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              className="hidden"
            />
          </div>

          <p className="text-center text-xs text-discord-400 -mt-4 mb-4">클릭하여 이미지 업로드 (최대 2MB)</p>

          {error && (
            <div className="bg-discord-red/20 border border-discord-red/40 text-discord-red rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                서버 이름 <span className="text-discord-red">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="나의 멋진 서버"
                className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                설명
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 서버는 무엇에 관한 건가요?"
                className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 bg-discord-700 hover:bg-discord-600 text-discord-200 font-semibold py-3 rounded-lg transition-colors">
                뒤로
              </button>
              <button type="submit" disabled={loading || !name.trim()} className="flex-1 bg-discord-accent hover:bg-discord-accent-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
                {loading ? '생성 중...' : '서버 만들기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
