export interface Message {
  id: string
  subject: string | null
  body: string
  createdAt: string
  senderId: string
  receiverId: string | null
  sender: { name: string; avatar: string | null }
  receiver?: { name: string; avatar: string | null }
}

export interface Submission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isRead: boolean
  createdAt: string
}
