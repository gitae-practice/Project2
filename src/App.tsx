import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { useServerStore } from './stores/serverStore'
import { useMessageStore } from './stores/messageStore'
import type { Profile, Server, Channel, ServerMember } from './types'
import AuthPage from './components/auth/AuthPage'
import ServerList from './components/layout/ServerList'
import ChannelList from './components/layout/ChannelList'
import MemberList from './components/layout/MemberList'
import ChatArea from './components/chat/ChatArea'
import DMSidebar from './components/dm/DMSidebar'
import DMArea from './components/dm/DMArea'
import CreateServerModal from './components/modals/CreateServerModal'
import CreateChannelModal from './components/modals/CreateChannelModal'
import InviteModal from './components/modals/InviteModal'
import InviteAcceptModal from './components/modals/InviteAcceptModal'
import ToastContainer from './components/ui/Toast'

export default function App() {
  const { user, setUser, setSession, setProfile } = useAuthStore()
  const {
    servers, currentServer, channels, currentChannel, members,
    setServers, setCurrentServer, setChannels, setCurrentChannel, setMembers,
  } = useServerStore()
  const { setCurrentDMPartner, currentDMPartner } = useMessageStore()

  const [showMemberList, setShowMemberList] = useState(true)
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(null)
  const [dmPartners, setDMPartners] = useState<Profile[]>([])
  const [currentDMProfile, setCurrentDMProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/invite/')) {
      const code = path.replace('/invite/', '').split('/')[0]
      if (code) {
        sessionStorage.setItem('pendingInvite', code)
        window.history.replaceState({}, '', '/')
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const code = sessionStorage.getItem('pendingInvite')
    if (!code) return
    sessionStorage.removeItem('pendingInvite')

    const handleExternalInvite = async () => {
      await supabase.rpc('create_invite_dm', { invite_code: code, app_origin: window.location.origin })
      const { data } = await supabase
        .from('server_invites')
        .select('created_by, profiles!created_by(id, username, avatar_url)')
        .eq('code', code)
        .single()
      if (data?.profiles) {
        const inviter = data.profiles as Profile
        setDMPartners((prev) => prev.find((p) => p.id === inviter.id) ? prev : [inviter, ...prev])
        setCurrentDMPartner(inviter.id)
        setCurrentDMProfile(inviter)
        setCurrentServer(null as any)
      } else {
        setActiveInviteCode(code)
      }
    }
    handleExternalInvite()
  }, [user?.id])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data as Profile) })
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    supabase
      .from('server_members')
      .select('server_id, servers(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setServers(data.map((d: any) => d.servers).filter(Boolean) as Server[])
      })
  }, [user?.id])

  useEffect(() => {
    if (!currentServer) return
    supabase.from('channels').select('*').eq('server_id', currentServer.id).order('created_at')
      .then(({ data }) => {
        if (data) {
          setChannels(data as Channel[])
          if (data.length > 0) setCurrentChannel(data[0] as Channel)
        }
      })
    supabase
      .from('server_members')
      .select('*, profile:profiles(id, username, avatar_url)')
      .eq('server_id', currentServer.id)
      .then(({ data }) => { if (data) setMembers(data as ServerMember[]) })
  }, [currentServer?.id])

  useEffect(() => {
    if (!user) return
    const fetchDMPartners = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      if (!data) return
      const partnerIds = [...new Set(
        data.map((m: any) => m.sender_id === user.id ? m.receiver_id : m.sender_id)
      )]
      if (partnerIds.length === 0) return
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', partnerIds)
      if (profiles) setDMPartners(profiles as Profile[])
    }
    fetchDMPartners()
  }, [user?.id])

  if (loading) {
    return (
      <div className="h-screen bg-discord-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-discord-accent animate-pulse" />
          <p className="text-discord-300 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  const handleSelectDMPartner = (partner: Profile) => {
    setCurrentDMPartner(partner.id)
    setCurrentDMProfile(partner)
    setDMPartners((prev) => prev.find((p) => p.id === partner.id) ? prev : [partner, ...prev])
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ServerList
        servers={servers}
        currentServer={currentServer}
        onSelectServer={(server) => {
          setCurrentServer(server)
          setCurrentDMPartner(null)
          setCurrentDMProfile(null)
        }}
        onCreateServer={() => setShowCreateServer(true)}
      />

      {currentServer ? (
        <>
          <ChannelList
            server={currentServer}
            channels={channels}
            currentChannel={currentChannel}
            onSelectChannel={setCurrentChannel}
            onCreateChannel={() => setShowCreateChannel(true)}
            onInvite={() => setShowInvite(true)}
          />
          <ChatArea
            channel={currentChannel}
            onToggleMemberList={() => setShowMemberList((v) => !v)}
          />
          {showMemberList && <MemberList members={members} />}
        </>
      ) : (
        <>
          <DMSidebar
            conversations={dmPartners}
            currentPartner={currentDMPartner}
            onSelectPartner={handleSelectDMPartner}
          />
          <DMArea partner={currentDMProfile} />
        </>
      )}

      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} />}
      {showCreateChannel && <CreateChannelModal onClose={() => setShowCreateChannel(false)} />}
      {showInvite && currentServer && <InviteModal server={currentServer} onClose={() => setShowInvite(false)} />}
      {activeInviteCode && <InviteAcceptModal code={activeInviteCode} onClose={() => setActiveInviteCode(null)} />}
      <ToastContainer />
    </div>
  )
}
