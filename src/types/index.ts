export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Server {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  owner_id: string
  created_at: string
}

export interface ServerMember {
  server_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Channel {
  id: string
  server_id: string
  name: string
  type: 'text' | 'announcement'
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface DMConversation {
  partner: Profile
  lastMessage?: DirectMessage
}
