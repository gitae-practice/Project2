import { create } from 'zustand'
import type { Message, DirectMessage, DMConversation } from '../types'

interface MessageState {
  messages: Message[]
  dmConversations: DMConversation[]
  currentDMPartner: string | null
  dmMessages: DirectMessage[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setDMConversations: (conversations: DMConversation[]) => void
  setCurrentDMPartner: (partnerId: string | null) => void
  setDMMessages: (messages: DirectMessage[]) => void
  addDMMessage: (message: DirectMessage) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  dmConversations: [],
  currentDMPartner: null,
  dmMessages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setDMConversations: (conversations) => set({ dmConversations: conversations }),
  setCurrentDMPartner: (partnerId) => set({ currentDMPartner: partnerId, dmMessages: [] }),
  setDMMessages: (messages) => set({ dmMessages: messages }),
  addDMMessage: (message) =>
    set((state) => ({ dmMessages: [...state.dmMessages, message] })),
}))
