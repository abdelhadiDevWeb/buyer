'use client'

import { Suspense } from 'react'
import Chat from '@/components/chat/Chat'

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Chat />
    </Suspense>
  )
}