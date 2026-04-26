import { create } from 'zustand'
import type { Message, DirectMessage, DMConversation } from '../types'

interface MessageState {
  messages: Message[]
  dmConversations: DMConversation[]
  currentDMPartner: string | null
  dmMessages: DirectMessage[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  editMessage: (id: string, content: string) => void
  removeMessage: (id: string) => void
  setDMConversations: (conversations: DMConversation[]) => void
  setCurrentDMPartner: (partnerId: string | null) => void
  setDMMessages: (messages: DirectMessage[]) => void
  addDMMessage: (message: DirectMessage) => void
  editDMMessage: (id: string, content: string) => void
  removeDMMessage: (id: string) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  dmConversations: [],
  currentDMPartner: null,
  dmMessages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  editMessage: (id, content) => set((state) => ({
    messages: state.messages.map((m) => m.id === id ? { ...m, content, is_edited: true } : m),
  })),
  removeMessage: (id) => set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
  setDMConversations: (conversations) => set({ dmConversations: conversations }),
  setCurrentDMPartner: (partnerId) => set({ currentDMPartner: partnerId, dmMessages: [] }),
  setDMMessages: (messages) => set({ dmMessages: messages }),
  addDMMessage: (message) => set((state) => ({ dmMessages: [...state.dmMessages, message] })),
  editDMMessage: (id, content) => set((state) => ({
    dmMessages: state.dmMessages.map((m) => m.id === id ? { ...m, content } : m),
  })),
  removeDMMessage: (id) => set((state) => ({ dmMessages: state.dmMessages.filter((m) => m.id !== id) })),
}))
