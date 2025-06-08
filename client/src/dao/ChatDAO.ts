import type { Chat, ChatMessage } from '@/entity/Chat'
import DAO from './DAO'
import { GenericConverter } from './GenericConverter'

class ChatDAO extends DAO<Chat> {
  constructor() {
    super('chat')
  }
  converter = new GenericConverter<Chat>()
}

export const chatDAO = new ChatDAO()

class ChatMessageDAO extends DAO<ChatMessage> {
  constructor() {
    super('chatmessage')
  }
  converter = new GenericConverter<ChatMessage>()
}

export const chatMessageDAO = new ChatMessageDAO()
