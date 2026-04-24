import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../../stores/toastStore'

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => remove(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: { id: string; message: string; type: string }; onRemove: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-discord-green flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-discord-red flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-discord-accent flex-shrink-0" />,
  }

  const borders = {
    success: 'border-discord-green/30',
    error: 'border-discord-red/30',
    info: 'border-discord-accent/30',
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 bg-discord-700 border ${borders[toast.type as keyof typeof borders]} rounded-xl px-4 py-3 shadow-2xl min-w-[260px] max-w-sm animate-slide-in`}
    >
      {icons[toast.type as keyof typeof icons]}
      <p className="text-white text-sm flex-1">{toast.message}</p>
      <button onClick={onRemove} className="text-discord-400 hover:text-white transition-colors ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
