import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toastStore'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email not confirmed': '이메일 인증이 필요합니다. 메일함을 확인해주세요.',
  'User already registered': '이미 가입된 이메일입니다.',
  'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
  'Unable to validate email address: invalid format': '올바른 이메일 형식이 아닙니다.',
  'Email rate limit exceeded': '잠시 후 다시 시도해주세요.',
  'signup_disabled': '현재 회원가입이 비활성화되어 있습니다.',
}

function translateError(msg: string): string {
  const lower = msg.toLowerCase()
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key.toLowerCase())) return val
  }
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { show } = useToastStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(translateError(error.message))
      } else {
        show('로그인되었습니다.', 'success')
      }
    } else {
      if (!username.trim()) {
        setError('사용자 이름을 입력해주세요.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim() } },
      })

      if (error) {
        console.error('[signup error]', error.message)
        setError(translateError(error.message))
      } else {
        await supabase.auth.signOut()
        show('회원가입이 완료되었습니다! 로그인해주세요.', 'success')
        setIsLogin(true)
        setEmail('')
        setPassword('')
        setUsername('')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-discord-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="GitaeCode" className="w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-discord-accent/30 object-cover" />
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? '다시 만나서 반가워요!' : '계정 만들기'}
          </h1>
          <p className="text-discord-300 text-sm mt-1">
            {isLogin ? 'GitaeCode에 로그인하세요' : 'GitaeCode에 합류하세요'}
          </p>
        </div>

        <div className="bg-discord-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="bg-discord-red/20 border border-discord-red/40 text-discord-red rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                  사용자 이름
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="홍길동"
                  className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-discord-200 text-xs font-semibold uppercase tracking-wide mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-discord-900 text-white placeholder-discord-400 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-discord-accent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-discord-accent hover:bg-discord-accent-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-discord-300 text-sm mt-6">
            {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null) }}
              className="text-discord-accent hover:underline font-medium"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
