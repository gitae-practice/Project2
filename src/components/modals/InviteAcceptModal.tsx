import { X } from 'lucide-react'
import InviteCard from '../dm/InviteCard'

interface Props {
  code: string
  onClose: () => void
}

export default function InviteAcceptModal({ code, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-discord-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-white mb-2">서버 초대</h2>
        <InviteCard code={code} onJoined={onClose} />
      </div>
    </div>
  )
}
