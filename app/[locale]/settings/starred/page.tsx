"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getStarredMessagesForUser } from '@/lib/storage'
import { getDirectMessageById, getConversationById, getUsers } from '@/lib/storage'
import type { Conversation, DirectMessage, User } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function highlight(text: string, q: string) {
  const query = q.trim()
  if (!query) return text
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(re)
  return parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="bg-yellow-200 rounded px-1">{p}</mark> : <span key={i}>{p}</span>))
}

export default function StarredMessagesPage() {
  const { user, isAuthenticated } = useAuth()
  const [q, setQ] = useState('')
  const [directory, setDirectory] = useState<Record<string, User>>({})

  useEffect(() => {
    const dir = getUsers().reduce<Record<string, User>>((acc, u) => { acc[u.id] = u; return acc }, {})
    setDirectory(dir)
  }, [])

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card><CardContent className="p-6 text-center">Sign in to view starred messages.</CardContent></Card>
      </div>
    )
  }

  const starred = getStarredMessagesForUser(user.id)
  const grouped = useMemo(() => {
    const map = new Map<string, { conversation: Conversation; items: Array<{ message: DirectMessage; starredAt: string }> }>()
    for (const s of starred) {
      const msg = getDirectMessageById(s.messageId)
      const conv = getConversationById(s.conversationId)
      if (!msg || !conv) continue
      if (q.trim()) {
        const content = msg.content || ''
        const attNames = (msg.attachments || []).map((a) => a.name || '').join(' ')
        const hay = `${content} ${attNames}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) continue
      }
      const e = map.get(conv.id) || { conversation: conv, items: [] }
      e.items.push({ message: msg, starredAt: s.starredAt })
      map.set(conv.id, e)
    }
    return Array.from(map.values()).sort((a, b) => a.conversation.updatedAt < b.conversation.updatedAt ? 1 : -1)
  }, [starred, q])

  const jumpTo = (conversationId: string, messageId: string) => {
    try { localStorage.setItem('pet_social_jump_to_message', JSON.stringify({ conversationId, messageId })) } catch {}
    window.location.href = '/messages'
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Starred Messages</h1>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search starred messages" className="w-64" />
      </div>
      {grouped.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No starred messages yet.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const others = group.conversation.participantIds
              .filter((pid) => pid !== user.id)
              .map((pid) => directory[pid])
              .filter(Boolean) as User[]
            const label = group.conversation.title || (others.length ? others.map((u) => u.fullName || u.username).join(', ') : 'Conversation')
            return (
              <div key={group.conversation.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{label}</div>
                  <Button variant="ghost" size="sm" onClick={() => jumpTo(group.conversation.id, group.items[0].message.id)}>
                    Open
                  </Button>
                </div>
                <div className="rounded-md border divide-y">
                  {group.items.map((it) => {
                    const sender = directory[it.message.senderId]
                    const preview = it.message.content?.trim() || (it.message.attachments?.[0]?.name || '(attachment)')
                    return (
                      <div key={it.message.id} className="flex items-start gap-3 p-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={sender?.avatar || '/placeholder.svg'} alt={sender?.fullName} /><AvatarFallback>{sender?.fullName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium truncate">{sender?.fullName || sender?.username || 'User'}</div>
                            <div className="text-xs text-muted-foreground">{new Date(it.starredAt).toLocaleString()}</div>
                          </div>
                          <div className="text-sm truncate">{highlight(preview, q)}</div>
                          <div className="mt-1 text-xs">
                            <Button variant="ghost" size="sm" onClick={() => jumpTo(group.conversation.id, it.message.id)}>Jump to message</Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

