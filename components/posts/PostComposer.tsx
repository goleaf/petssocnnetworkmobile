"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { PrivacySelector } from "@/components/privacy-selector"
import { useAuth } from "@/lib/auth"
import { addBlogPost, getPetById, getPetsByOwnerId } from "@/lib/storage"
import type { BlogPost, PrivacyLevel, Draft } from "@/lib/types"
import { getCurrentPetId } from "@/lib/pets/current-pet"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Bold, Italic, List, ListOrdered, Tags, MapPin, SmilePlus, ImagePlus, BarChart2 } from "lucide-react"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import Suggestion from "@tiptap/suggestion"
import { Mention } from "@/components/posts/extensions/mention"
import { Hashtag } from "@/components/posts/extensions/hashtag"
import { getFilteredSuggestions } from "@/lib/utils/tag-suggestions"
import { getUsers } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { PostMediaAttachments, type PostMediaValue } from "@/components/posts/PostMediaAttachments"
import { PetTagSelector } from "@/components/posts/PetTagSelector"
import { LocationSelector } from "@/components/posts/LocationSelector"
import { FeelingActivitySelector } from "@/components/posts/FeelingActivitySelector"
import { GifPicker } from "@/components/posts/GifPicker"
import { PollBuilder } from "@/components/posts/PollBuilder"
import { getPlaceById } from "@/lib/storage"
import { VisibilitySelector } from "@/components/posts/VisibilitySelector"
import { saveDraft, getDraftById } from "@/lib/drafts"
import { toast } from "sonner"

interface PostComposerProps {
  onSubmitted?: () => void
  onCancel?: () => void
  className?: string
  initialDraftId?: string
}

export function PostComposer({ onSubmitted, onCancel, className, initialDraftId }: PostComposerProps) {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [petId, setPetId] = useState<string>("")
  const [privacy, setPrivacy] = useState<PrivacyLevel>("public")
  const [visibility, setVisibility] = useState<{ mode: import('./VisibilitySelector').VisibilityMode, privacy: PrivacyLevel, allowedUserIds?: string[], scheduledAt?: string | null }>({ mode: 'public', privacy: 'public', allowedUserIds: [], scheduledAt: null })
  const [pets, setPets] = useState(() => (user ? getPetsByOwnerId(user.id) : []))
  const [charCount, setCharCount] = useState(0)
  const [postMode, setPostMode] = useState<'post' | 'question' | 'event' | 'listing'>(() => 'post')
  const [questionCategory, setQuestionCategory] = useState<import("@/lib/types").BlogPost['questionCategory']>()
  const MAX_CHARS = postMode === 'question' ? 1000 : (postMode === 'event' ? 2000 : (postMode === 'listing' ? 2000 : 5000))
  // Event fields
  const [eventTitle, setEventTitle] = useState("")
  const [eventStartLocal, setEventStartLocal] = useState("") // datetime-local string
  const [eventDuration, setEventDuration] = useState<number>(60)
  const [eventTimezone, setEventTimezone] = useState<string>(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
  })
  // Listing fields
  const [listingTitle, setListingTitle] = useState("")
  const [listingPrice, setListingPrice] = useState<string>("")
  const [listingCurrency, setListingCurrency] = useState<string>('USD')
  const [listingCondition, setListingCondition] = useState<import("@/lib/types").BlogPost['listingCondition']>('Good')
  const [listingCategory, setListingCategory] = useState<import("@/lib/types").BlogPost['listingCategory']>('Other')
  const [listingLocalPickup, setListingLocalPickup] = useState<boolean>(true)
  const [listingShippingAvail, setListingShippingAvail] = useState<boolean>(false)
  const [listingPaymentMethods, setListingPaymentMethods] = useState<string[]>([])
  const [media, setMedia] = useState<PostMediaValue>({ images: [], video: null, allowDownload: true })
  const [taggedPetIds, setTaggedPetIds] = useState<string[]>([])
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [feeling, setFeeling] = useState<string | undefined>(undefined)
  const [activity, setActivity] = useState<string | undefined>(undefined)
  const [poll, setPoll] = useState<import("@/lib/types").PostPoll | null>(null)

  const [openPets, setOpenPets] = useState(false)
  const [openLocation, setOpenLocation] = useState(false)
  const [openFeeling, setOpenFeeling] = useState(false)
  const [openGif, setOpenGif] = useState(false)
  const [openPoll, setOpenPoll] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    const list = getPetsByOwnerId(user.id)
    setPets(list)
    const current = getCurrentPetId()
    if (current && getPetById(current)) {
      setPetId(current)
    } else if (list.length) {
      setPetId(list[0]!.id)
    }
  }, [user?.id])

  useEffect(() => {
    // Default privacy from user preferences if available
    if (!user) return
    const base = user.privacy?.posts || "public"
    setPrivacy(base)
    setVisibility((v) => ({ ...v, privacy: base }))
  }, [user?.id])

  // Load initial draft if provided
  useEffect(() => {
    if (!initialDraftId || !user) return
    const d = getDraftById(initialDraftId)
    if (!d || d.userId !== user.id) return
    try {
      setDraftId(d.id)
      setContent(d.content || "")
      const m = d.metadata || {}
      setPetId(m.petId || petId)
      setTaggedPetIds(m.taggedPetIds || [])
      setPlaceId(m.placeId || null)
      setFeeling(m.feeling)
      setActivity(m.activity)
      setPoll(m.poll || null)
      if (m.postMode === 'question') {
        setPostMode('question')
        setQuestionCategory(m.questionCategory)
      } else if (m.postMode === 'event') {
        setPostMode('event')
        setEventTitle(m.eventTitle || "")
        setEventStartLocal(m.eventStartLocal || "")
        setEventDuration(Number(m.eventDuration || 60))
        setEventTimezone(m.eventTimezone || eventTimezone)
      } else if (m.postMode === 'listing') {
        setPostMode('listing')
        setListingTitle(m.listingTitle || "")
        setListingPrice(m.listingPrice || "")
        setListingCurrency(m.listingCurrency || 'USD')
        setListingCondition(m.listingCondition || 'Good')
        setListingCategory(m.listingCategory || 'Other')
        setListingLocalPickup(Boolean(m.listingLocalPickup ?? true))
        setListingShippingAvail(Boolean(m.listingShippingAvail ?? false))
        setListingPaymentMethods(Array.isArray(m.listingPaymentMethods) ? m.listingPaymentMethods : [])
      }
      setVisibility((v) => ({ ...v, mode: m.visibilityMode || v.mode, privacy: m.privacy || v.privacy, allowedUserIds: m.allowedUserIds || [], scheduledAt: m.scheduledAt || null }))
      setPrivacy(m.privacy || privacy)
      const imgs = Array.isArray(m.media?.images) ? m.media.images : []
      setMedia({ images: (imgs || []).map((src: string) => ({ id: `img_${Math.random().toString(36).slice(2, 8)}`, src, caption: m.media?.captions?.[src] })), video: null })
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftId, user?.id])

  // Auto-save draft every 10 seconds after changes
  useEffect(() => {
    if (!user) return
    const id = draftId || `feed_${user.id}_${Date.now()}`
    setDraftId(id)
    const t = setTimeout(() => {
      const draft: Draft = {
        id,
        userId: user.id,
        type: "feed",
        title: content.substring(0, 60) || "Untitled Draft",
        content,
        metadata: {
          petId,
          privacy,
          postMode,
          questionCategory,
          visibilityMode: visibility.mode,
          allowedUserIds: visibility.allowedUserIds,
          scheduledAt: visibility.scheduledAt,
          taggedPetIds,
          placeId,
          feeling,
          activity,
          poll,
          postMode,
          questionCategory,
          // Event fields
          eventTitle,
          eventStartLocal,
          eventDuration,
          eventTimezone,
          // Listing fields
          listingTitle,
          listingPrice,
          listingCurrency,
          listingCondition,
          listingCategory,
          listingLocalPickup,
          listingShippingAvail,
          listingPaymentMethods,
          media: {
            images: media.images.map((i) => i.src),
            captions: media.images.reduce((acc, i) => { if (i.caption) acc[i.src] = i.caption; return acc }, {} as Record<string,string>),
          },
        },
        lastSaved: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      saveDraft(draft)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
    }, 10000)
    return () => clearTimeout(t)
  }, [user?.id, content, petId, privacy, visibility, taggedPetIds.join(','), placeId, feeling, activity, poll, media.images.map(i => i.src+ (i.caption||'')).join('|')])

  const saveDraftNow = () => {
    if (!user) return
    const id = draftId || `feed_${user.id}_${Date.now()}`
    setDraftId(id)
    const draft: Draft = {
      id,
      userId: user.id,
      type: "feed",
      title: content.substring(0, 60) || "Untitled Draft",
      content,
      metadata: {
        petId,
        privacy,
        postMode,
        questionCategory,
        // Event fields
        eventTitle,
        eventStartLocal,
        eventDuration,
        eventTimezone,
        // Listing fields
        listingTitle,
        listingPrice,
        listingCurrency,
        listingCondition,
        listingCategory,
        listingLocalPickup,
        listingShippingAvail,
        listingPaymentMethods,
        visibilityMode: visibility.mode,
        allowedUserIds: visibility.allowedUserIds,
        scheduledAt: visibility.scheduledAt,
        taggedPetIds,
        placeId,
        feeling,
        activity,
        poll,
        media: {
          images: media.images.map((i) => i.src),
          captions: media.images.reduce((acc, i) => { if (i.caption) acc[i.src] = i.caption; return acc }, {} as Record<string,string>),
        },
      },
      lastSaved: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    saveDraft(draft)
    toast.success("Draft saved")
  }

  const canPost = useMemo(() => {
    if (!user || !petId) return false
    if (postMode === 'event') {
      const hasTitle = eventTitle.trim().length > 0 && eventTitle.trim().length <= 100
      const hasWhen = !!eventStartLocal
      return hasTitle && hasWhen && charCount <= MAX_CHARS
    } else if (postMode === 'listing') {
      const hasTitle = listingTitle.trim().length > 0 && listingTitle.trim().length <= 100
      const hasPrice = Number.isFinite(Number(listingPrice)) && Number(listingPrice) >= 0
      const hasShippingOption = listingLocalPickup || listingShippingAvail
      const hasLocation = listingLocalPickup ? Boolean(placeId) : true
      return hasTitle && hasPrice && hasShippingOption && hasLocation && charCount <= MAX_CHARS
    }
    return Boolean(content.trim().length > 0 && charCount <= MAX_CHARS)
  }, [user, petId, postMode, content, charCount, MAX_CHARS, eventTitle, eventStartLocal, listingTitle, listingPrice, placeId])

  // Mention suggestions (followed users)
  const mentionSuggestion = useMemo(() => {
    const followingIds = new Set(user?.following ?? [])
    const followedUsers = getUsers().filter((u) => followingIds.has(u.id))
    return {
      char: '@',
      items: ({ query }: { query: string }) => {
        const q = query.toLowerCase()
        return followedUsers
          .filter((u) => u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q))
          .slice(0, 8)
          .map((u) => ({ id: u.id, label: u.username, fullName: u.fullName, avatar: u.avatar }))
      },
      render: () => {
        let dom: HTMLDivElement | null = null
        let list: HTMLUListElement | null = null
        let onKeyDown: ((props: any) => boolean) | null = null

        return {
          onStart: (props: any) => {
            dom = document.createElement('div')
            dom.className =
              'z-50 bg-background border rounded-md shadow-md overflow-hidden min-w-[220px]'
            Object.assign(dom.style, {
              position: 'absolute',
              left: `${props.clientRect?.left ?? 0}px`,
              top: `${(props.clientRect?.bottom ?? 0) + 4}px`,
            })
            list = document.createElement('ul')
            list.className = 'max-h-64 overflow-auto'
            dom.appendChild(list)
            document.body.appendChild(dom)
            this.onUpdate!(props)
          },
          onUpdate: (props: any) => {
            if (!list || !dom) return
            list.innerHTML = ''
            props.items.forEach((item: any, idx: number) => {
              const li = document.createElement('li')
              li.className = cn(
                'px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-accent',
                idx === props.selected ? 'bg-accent' : ''
              )
              const img = document.createElement('img')
              img.src = item.avatar || '/placeholder.svg'
              img.alt = item.fullName
              img.width = 20
              img.height = 20
              img.className = 'rounded-full'
              const span = document.createElement('span')
              span.textContent = `@${item.label}`
              li.appendChild(img)
              li.appendChild(span)
              li.addEventListener('mousedown', (e) => {
                e.preventDefault()
                props.command(item)
              })
              list!.appendChild(li)
            })
            Object.assign(dom.style, {
              left: `${props.clientRect?.left ?? 0}px`,
              top: `${(props.clientRect?.bottom ?? 0) + 4}px`,
            })
          },
          onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
              props.event.preventDefault()
              props.command(null)
              return true
            }
            return false
          },
          onExit: () => {
            dom?.remove()
            dom = null
            list = null
          },
        }
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, (user?.following || []).join(',')])

  // Hashtag suggestions
  const hashtagSuggestion = useMemo(() => {
    return {
      char: '#',
      items: ({ query }: { query: string }) => {
        return getFilteredSuggestions(query, 8).map((t) => ({ label: t }))
      },
      render: () => {
        let dom: HTMLDivElement | null = null
        let list: HTMLUListElement | null = null
        return {
          onStart: (props: any) => {
            dom = document.createElement('div')
            dom.className = 'z-50 bg-background border rounded-md shadow-md overflow-hidden min-w-[180px]'
            Object.assign(dom.style, {
              position: 'absolute',
              left: `${props.clientRect?.left ?? 0}px`,
              top: `${(props.clientRect?.bottom ?? 0) + 4}px`,
            })
            list = document.createElement('ul')
            list.className = 'max-h-64 overflow-auto'
            dom.appendChild(list)
            document.body.appendChild(dom)
            this.onUpdate!(props)
          },
          onUpdate: (props: any) => {
            if (!list || !dom) return
            list.innerHTML = ''
            props.items.forEach((item: any, idx: number) => {
              const li = document.createElement('li')
              li.className = cn('px-3 py-2 cursor-pointer hover:bg-accent', idx === props.selected ? 'bg-accent' : '')
              li.textContent = `#${item.label}`
              li.addEventListener('mousedown', (e) => {
                e.preventDefault()
                props.command(item)
              })
              list!.appendChild(li)
            })
            Object.assign(dom.style, {
              left: `${props.clientRect?.left ?? 0}px`,
              top: `${(props.clientRect?.bottom ?? 0) + 4}px`,
            })
          },
          onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
              props.event.preventDefault()
              props.command(null)
              return true
            }
            return false
          },
          onExit: () => {
            dom?.remove()
            dom = null
            list = null
          },
        }
      },
    }
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: "What's on your mind?" }),
      Mention.configure({ suggestion: mentionSuggestion }),
      Hashtag.configure({ suggestion: hashtagSuggestion }),
    ],
    editorProps: {
      attributes: {
        class: cn('prose-sm p-3 outline-none', 'min-h-[4.5rem] max-h-[30rem] overflow-y-auto'),
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      setContent(text)
      setCharCount(text.length)
    },
  })

  const handleSubmit = () => {
    if (!user || !canPost) return
    const now = new Date().toISOString()
    const language =
      user.displayPreferences?.primaryLanguage ||
      user.displayPreferences?.preferredContentLanguages?.[0] ||
      "en"

    const hashtags = Array.from(new Set((content.match(/#([A-Za-z0-9_]+)/g) || []).map((h) => h.replace(/^#/, '').toLowerCase())))

    const isQuestion = postMode === 'question'
    const isEvent = postMode === 'event'
    const isListing = postMode === 'listing'
    const titleBase = isEvent ? eventTitle.substring(0, 100) : (isListing ? listingTitle.substring(0, 100) : content.substring(0, 50))
    const title = isQuestion
      ? `Question: ${titleBase}`
      : isEvent
        ? titleBase
        : (titleBase + (content.length > 50 ? "..." : ""))

    const post: BlogPost = {
      id: String(Date.now()),
      petId,
      authorId: user.id,
      title,
      content,
      language,
      tags: [],
      categories: [],
      likes: [],
      createdAt: now,
      updatedAt: now,
      privacy,
      hashtags,
      media: {
        images: media.images.map((i) => i.src),
        videos: media.video ? [media.video.src] : [],
        links: [],
        captions: media.images.reduce((acc, i) => {
          if (i.caption) acc[i.src] = i.caption
          return acc
        }, {} as Record<string, string>),
        imageTags: media.images.reduce((acc, i) => {
          if (i.taggedPetIds && i.taggedPetIds.length) acc[i.src] = i.taggedPetIds
          return acc
        }, {} as Record<string, string[]>),
        allowDownload: media.allowDownload,
        videoThumbnail: media.videoThumbnail,
        videoCaptions: media.videoCaptionsVtt ? [{ lang: 'en', label: 'English', vtt: media.videoCaptionsVtt }] : undefined,
      },
      taggedPetIds: taggedPetIds.length ? taggedPetIds : undefined,
      placeId: placeId || undefined,
      feeling,
      activity,
      poll: poll || undefined,
      visibilityMode: visibility.mode,
      allowedUserIds: visibility.mode === 'custom' ? (visibility.allowedUserIds || []) : undefined,
      queueStatus: visibility.scheduledAt ? 'scheduled' : (visibility.mode === 'private' ? 'draft' : undefined),
      scheduledAt: visibility.scheduledAt || undefined,
      ...(isQuestion ? { postType: 'question' as const, questionCategory: questionCategory } : {}),
      ...(isEvent ? {
        postType: 'event' as const,
        eventStartAt: eventStartLocal ? new Date(eventStartLocal).toISOString() : undefined,
        eventDurationMinutes: eventDuration || undefined,
        eventTimezone: eventTimezone || undefined,
      } : {}),
      ...(isEvent && media.images.length > 0 ? { coverImage: media.images[0]!.src } : {}),
      ...(isListing ? {
        postType: 'listing' as const,
        title: listingTitle.substring(0, 100),
        listingPrice: Number(listingPrice),
        listingCurrency,
        listingCondition,
        listingCategory,
        listingShipping: { localPickup: listingLocalPickup, shippingAvailable: listingShippingAvail },
        listingPaymentMethods,
      } : {}),
    }

    addBlogPost(post)
    setContent("")
    editor?.commands.clearContent(true)
    setMedia({ images: [], video: null })
    setTaggedPetIds([])
    setPlaceId(null)
    setFeeling(undefined)
    setActivity(undefined)
    setPoll(null)
    onSubmitted?.()
  }

  if (!user) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">Please sign in to create a post.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
          <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive('bold') ? 'bg-accent' : ''}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive('italic') ? 'bg-accent' : ''}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={editor?.isActive('bulletList') ? 'bg-accent' : ''}
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={editor?.isActive('orderedList') ? 'bg-accent' : ''}
              type="button"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <EmojiPicker onPick={(e) => editor?.chain().focus().insertContent(e).run()} size="sm" />
            <div className="ml-auto text-xs text-muted-foreground">
              <span className={charCount > MAX_CHARS ? 'text-red-600 font-medium' : ''}>{charCount}</span> / {MAX_CHARS}
            </div>
          </div>
          {/* Editor */}
          <div className="border rounded-md">
            <EditorContent editor={editor} />
          </div>
          {/* Post type + extras (Question/Event) */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type</span>
              <Select value={postMode} onValueChange={(v) => setPostMode(v as 'post' | 'question' | 'event' | 'listing')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="listing">Marketplace Listing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {postMode === 'question' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Category</span>
                <Select value={questionCategory || ''} onValueChange={(v) => setQuestionCategory(v as any)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Behavior">Behavior</SelectItem>
                    <SelectItem value="Products">Products</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {postMode === 'listing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Item title</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm bg-background"
                    placeholder="e.g., Large Dog Bed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Price</label>
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm bg-background"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Currency</label>
                    <Select value={listingCurrency} onValueChange={setListingCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Condition</label>
                  <Select value={listingCondition || 'Good'} onValueChange={(v) => setListingCondition(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select value={listingCategory || 'Other'} onValueChange={(v) => setListingCategory(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Toys">Toys</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground">Shipping</label>
                    <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={listingLocalPickup} onChange={(e) => setListingLocalPickup(e.target.checked)} /> Local pickup</label>
                    <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={listingShippingAvail} onChange={(e) => setListingShippingAvail(e.target.checked)} /> Shipping available</label>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Payment methods</span>
                    {['Cash','PayPal','Venmo','Zelle','Card','Other'].map((m) => {
                      const active = listingPaymentMethods.includes(m)
                      return (
                        <button key={m} type="button" className={cn('text-xs px-2 py-1 rounded border', active ? 'bg-primary text-primary-foreground' : '')} onClick={() => setListingPaymentMethods((prev) => active ? prev.filter(x => x!==m) : [...prev, m])}>{m}</button>
                      )
                    })}
                  </div>
                  {listingLocalPickup && !placeId && (
                    <div className="text-xs text-red-600">Location is required for local pickup. Click Location below to select.</div>
                  )}
                  {!listingLocalPickup && !listingShippingAvail && (
                    <div className="text-xs text-red-600">Choose at least one shipping option.</div>
                  )}
                </div>
              </div>
            )}
            {postMode === 'event' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Event title</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm bg-background"
                    placeholder="e.g., Pet Playdate at the Park"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Date & time</label>
                  <input
                    type="datetime-local"
                    value={eventStartLocal}
                    onChange={(e) => setEventStartLocal(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Duration</label>
                  <Select value={String(eventDuration)} onValueChange={(v) => setEventDuration(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Timezone</label>
                  <input
                    type="text"
                    value={eventTimezone}
                    onChange={(e) => setEventTimezone(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm bg-background"
                    placeholder="e.g., America/Los_Angeles"
                  />
                </div>
              </div>
            )}
          </div>
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <Select value={petId} onValueChange={setPetId}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Select pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={p.avatar || "/placeholder.svg"} alt={p.name} />
                          <AvatarFallback className="text-xs">{p.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Visibility selector with schedule action */}
              <VisibilitySelector
                value={visibility}
                onChange={(v) => { setVisibility(v); setPrivacy(v.privacy) }}
              />
            </div>
            <div className="flex gap-2 sm:justify-end">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} type="button">
                  Cancel
                </Button>
              )}
              <Button variant="outline" onClick={() => { saveDraftNow(); onCancel?.() }} type="button">
                Save Draft
              </Button>
              <Button onClick={handleSubmit} disabled={!canPost} type="button">
                Post
              </Button>
            </div>
          </div>

          {justSaved && (
            <div className="text-xs text-muted-foreground text-right">Draft saved</div>
          )}

          {/* Selected context chips */}
          {(taggedPetIds.length > 0 || placeId || feeling || activity || poll) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {taggedPetIds.map((pid) => {
                const p = getPetById(pid)
                if (!p) return null
                return (
                  <span key={pid} className="px-2 py-1 rounded-full bg-accent text-foreground">@{p.name}</span>
                )
              })}
              {placeId && (
                <span className="px-2 py-1 rounded-full bg-accent text-foreground">at {getPlaceById(placeId!)?.name}</span>
              )}
              {feeling && (
                <span className="px-2 py-1 rounded-full bg-accent text-foreground">feeling {feeling}</span>
              )}
              {activity && (
                <span className="px-2 py-1 rounded-full bg-accent text-foreground">{activity}</span>
              )}
              {poll && (
                <span className="px-2 py-1 rounded-full bg-accent text-foreground">poll • {poll.options.length} options</span>
              )}
            </div>
          )}

          {/* Enhancement Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenPets(true)}>
              <Tags className="h-4 w-4 mr-1" /> Tag Pets
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenLocation(true)}>
              <MapPin className="h-4 w-4 mr-1" /> Location
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenFeeling(true)}>
              <SmilePlus className="h-4 w-4 mr-1" /> Feeling/Activity
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenGif(true)}>
              <ImagePlus className="h-4 w-4 mr-1" /> GIF
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenPoll(true)}>
              <BarChart2 className="h-4 w-4 mr-1" /> Poll
            </Button>
          </div>

          {/* Media attachments */}
          <PostMediaAttachments value={media} onChange={setMedia} />
        </div>
      </div>

      {/* Modals */}
      <PetTagSelector open={openPets} onOpenChange={setOpenPets} selected={taggedPetIds} onChange={setTaggedPetIds} />
      <LocationSelector
        open={openLocation}
        onOpenChange={setOpenLocation}
        selected={placeId ? getPlaceById(placeId) || null : null}
        onSelect={(p) => setPlaceId(p?.id || null)}
      />
      <FeelingActivitySelector
        open={openFeeling}
        onOpenChange={setOpenFeeling}
        value={{ feeling, activity }}
        onChange={({ feeling, activity }) => { setFeeling(feeling); setActivity(activity) }}
        petNames={taggedPetIds.map((id) => getPetById(id)?.name || '').filter(Boolean)}
      />
      <GifPicker open={openGif} onOpenChange={setOpenGif} onPick={(url) => setMedia((m) => ({ ...m, images: [...m.images, { id: `gif_${Date.now()}`, src: url }] }))} />
      <PollBuilder open={openPoll} onOpenChange={setOpenPoll} value={poll || undefined} onChange={(p) => setPoll(p)} />
    </div>
  )
}

export default PostComposer
