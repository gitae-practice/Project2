let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!_ctx) _ctx = new AudioContext()
    return _ctx
  } catch {
    return null
  }
}

export function unlockAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume()
}

function _play(ctx: AudioContext, type: 'dm' | 'message') {
  try {
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    if (type === 'dm') {
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.connect(gain)
        osc.frequency.value = freq
        osc.type = 'sine'
        const t = ctx.currentTime + i * 0.15
        gain.gain.setValueAtTime(0.18, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        osc.start(t)
        osc.stop(t + 0.25)
      })
    } else {
      const osc = ctx.createOscillator()
      osc.connect(gain)
      osc.frequency.value = 660
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {}
}

export function playSound(type: 'dm' | 'message' = 'dm') {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => _play(ctx, type)).catch(() => {})
  } else {
    _play(ctx, type)
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!document.hidden) return
  const n = new Notification(title, {
    body: body.length > 60 ? body.slice(0, 57) + '...' : body,
    icon: '/logo.png',
  })
  setTimeout(() => n.close(), 5000)
}
