import { create } from 'zustand'
import type { Server, Channel, ServerMember } from '../types'

interface ServerState {
  servers: Server[]
  currentServer: Server | null
  channels: Channel[]
  currentChannel: Channel | null
  members: ServerMember[]
  setServers: (servers: Server[]) => void
  setCurrentServer: (server: Server | null) => void
  setChannels: (channels: Channel[]) => void
  setCurrentChannel: (channel: Channel | null) => void
  setMembers: (members: ServerMember[]) => void
  addServer: (server: Server) => void
  addChannel: (channel: Channel) => void
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  currentServer: null,
  channels: [],
  currentChannel: null,
  members: [],
  setServers: (servers) => set({ servers }),
  setCurrentServer: (server) => set({ currentServer: server, currentChannel: null, channels: [] }),
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setMembers: (members) => set({ members }),
  addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
}))
