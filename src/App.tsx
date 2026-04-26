import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { playSound, unlockAudio, requestNotificationPermission, showBrowserNotification } from './lib/notifications'
import { useAuthStore } from './stores/authStore'
import { useServerStore } from './stores/serverStore'
import { useMessageStore } from './stores/messageStore'
import { useToastStore } from './stores/toastStore'
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

  const { show } = useToastStore()

  const [showMemberList, setShowMemberList] = useState(true)
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(null)
  const [dmPartners, setDMPartners] = useState<Profile[]>([])
  const [currentDMProfile, setCurrentDMProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadDMCount, setUnreadDMCount] = useState(0)
  const [unreadChannels, setUnreadChannels] = useState<Record<string, number>>({})
  const [channelServerMap, setChannelServerMap] = useState<Record<string, string>>({})
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  const currentServerRef = useRef(currentServer)
  const currentDMPartnerRef = useRef(currentDMPartner)
  const currentChannelRef = useRef(currentChannel)
  useEffect(() => { currentServerRef.current = currentServer }, [currentServer])
  useEffect(() => { currentDMPartnerRef.current = currentDMPartner }, [currentDMPartner])
  useEffect(() => { currentChannelRef.current = currentChannel }, [currentChannel])

  const unreadServers = useMemo(() => {
    const result: Record<string, number> = {}
    for (const [chId, count] of Object.entries(unreadChannels)) {
      const serverId = channelServerMap[chId]
      if (serverId) result[serverId] = (result[serverId] ?? 0) + count
    }
    return result
  }, [unreadChannels, channelServerMap])

  useEffect(() => { requestNotificationPermission() }, [])
  useEffect(() => {
    document.addEventListener('click', unlockAudio)
    document.addEventListener('keydown', unlockAudio)
    return () => {
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('keydown', unlockAudio)
    }
  }, [])

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
        const inviter = data.profiles as unknown as Profile
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
    if (!servers.length) return
    supabase.from('channels').select('id, server_id')
      .in('server_id', servers.map((s) => s.id))
      .then(({ data }) => {
        if (data) setChannelServerMap((prev) => {
          const next = { ...prev }
          data.forEach((ch: any) => { next[ch.id] = ch.server_id })
          return next
        })
      })
  }, [servers.length])

  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel('channel_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.user_id === user.id) return
        const chId = payload.new.channel_id
        const isViewing = currentServerRef.current !== null && currentChannelRef.current?.id === chId
        if (!isViewing) {
          setUnreadChannels((prev) => ({ ...prev, [chId]: (prev[chId] ?? 0) + 1 }))
          playSound('message')
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

  useEffect(() => {
    if (!currentChannel) return
    setUnreadChannels((prev) => {
      if (!prev[currentChannel.id]) return prev
      const next = { ...prev }
      delete next[currentChannel.id]
      return next
    })
  }, [currentChannel?.id])

  useEffect(() => {
    if (!user) return
    const sub = supabase
      .channel('dm_notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const viewingThisDM = currentServerRef.current === null &&
          currentDMPartnerRef.current === payload.new.sender_id
        if (!viewingThisDM) {
          setUnreadDMCount((prev) => prev + 1)
          playSound('dm')
          const { data } = await supabase.from('profiles').select('username').eq('id', payload.new.sender_id).single()
          showBrowserNotification(data?.username ?? '새 메시지', payload.new.content)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('presence:global', {
      config: { presence: { key: user.id } },
    })
    ch.on('presence', { event: 'sync' }, () => {
      setOnlineUserIds(new Set(Object.keys(ch.presenceState())))
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ user_id: user.id })
    })
    return () => { supabase.removeChannel(ch) }
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const sub = supabase.channel('kick_watch')
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'server_members',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const serverId = payload.old.server_id
        setServers(useServerStore.getState().servers.filter((s) => s.id !== serverId))
        if (currentServerRef.current?.id === serverId) setCurrentServer(null)
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id])

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

  const handleKickMember = async (userId: string) => {
    if (!currentServer) return
    const member = members.find((m) => m.user_id === userId)
    const name = member?.profile?.username ?? '이 멤버'
    if (!window.confirm(`${name}님을 서버에서 강퇴하시겠습니까?`)) return
    await supabase.from('server_members').delete().eq('server_id', currentServer.id).eq('user_id', userId)
    setMembers(members.filter((m) => m.user_id !== userId))
    show(`${name}님을 강퇴했습니다.`, 'info')
  }

  const handleDeleteConversation = (partnerId: string) => {
    setDMPartners((prev) => prev.filter((p) => p.id !== partnerId))
    if (currentDMPartner === partnerId) {
      setCurrentDMPartner(null)
      setCurrentDMProfile(null)
    }
  }

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
        unreadDMCount={unreadDMCount}
        unreadServers={unreadServers}
        onSelectServer={(server) => {
          setCurrentServer(server)
          if (server === null) setUnreadDMCount(0)
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
            unreadChannels={unreadChannels}
            onSelectChannel={setCurrentChannel}
            onCreateChannel={() => setShowCreateChannel(true)}
            onInvite={() => setShowInvite(true)}
          />
          <ChatArea
            channel={currentChannel}
            onToggleMemberList={() => setShowMemberList((v) => !v)}
          />
          {showMemberList && (
            <MemberList
              members={members}
              onlineUserIds={onlineUserIds}
              currentUserId={user.id}
              isOwner={currentServer?.owner_id === user.id}
              onKick={handleKickMember}
            />
          )}
        </>
      ) : (
        <>
          <DMSidebar
            conversations={dmPartners}
            currentPartner={currentDMPartner}
            onlineUserIds={onlineUserIds}
            onSelectPartner={handleSelectDMPartner}
            onDeleteConversation={handleDeleteConversation}
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
