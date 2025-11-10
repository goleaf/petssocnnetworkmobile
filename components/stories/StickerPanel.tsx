"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Smile, Image as ImageIcon, MapPin, AtSign, Hash, BarChart3, HelpCircle, Clock, Music, Brain, Cloud } from "lucide-react"
import { EmojiSticker } from "./stickers/EmojiSticker"
import { GifSticker } from "./stickers/GifSticker"
import { LocationSticker } from "./stickers/LocationSticker"
import { MentionSticker } from "./stickers/MentionSticker"
import { PollSticker } from "./stickers/PollSticker"
import { QuestionSticker } from "./stickers/QuestionSticker"
import { CountdownSticker } from "./stickers/CountdownSticker"
import type { StoryOverlay } from "@/lib/types"
import type {
  StickerType,
  PollStickerData,
  QuestionStickerData,
  CountdownStickerData,
  LocationStickerData,
  MentionStickerData,
  GifStickerData,
} from "./stickers/types"

interface StickerPanelProps {
  onAddSticker: (sticker: StoryOverlay) => void
  onClose: () => void
}

export function StickerPanel({ onAddSticker, onClose }: StickerPanelProps) {
  const [activeTab, setActiveTab] = useState<StickerType>("emoji")
  const [showCreator, setShowCreator] = useState(false)

  const handleEmojiSelect = (emoji: string) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "sticker",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      text: emoji,
      data: { stickerType: "emoji" },
    }
    onAddSticker(sticker)
    onClose()
  }

  const handleGifSelect = (gifData: GifStickerData) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "gif",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      data: gifData,
    }
    onAddSticker(sticker)
    onClose()
  }

  const handleLocationSelect = (locationData: LocationStickerData) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "location",
      x: 0.5,
      y: 0.8,
      scale: 1,
      rotation: 0,
      data: locationData,
    }
    onAddSticker(sticker)
    onClose()
  }

  const handleMentionSelect = (mentionData: MentionStickerData) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "sticker",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      text: `@${mentionData.username}`,
      data: { stickerType: "mention", ...mentionData },
    }
    onAddSticker(sticker)
    onClose()
  }

  const handlePollSave = (pollData: PollStickerData) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "poll",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      data: pollData,
    }
    onAddSticker(sticker)
    setShowCreator(false)
    onClose()
  }

  const handleQuestionSave = (questionData: QuestionStickerData) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "question",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      data: questionData,
    }
    onAddSticker(sticker)
    setShowCreator(false)
    onClose()
  }

  const handleCountdownSave = (countdownData: CountdownStickerData) => {
    const sticker: StoryOverlay = {
      id: `sticker-${Date.now()}`,
      type: "countdown",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      data: countdownData,
    }
    onAddSticker(sticker)
    setShowCreator(false)
    onClose()
  }

  const handleHashtagClick = () => {
    // Simple hashtag input
    const hashtag = prompt("Enter hashtag (without #):")
    if (hashtag) {
      const sticker: StoryOverlay = {
        id: `sticker-${Date.now()}`,
        type: "sticker",
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        text: `#${hashtag}`,
        data: { stickerType: "hashtag" },
      }
      onAddSticker(sticker)
      onClose()
    }
  }

  // Show creator for poll, question, countdown
  if (showCreator) {
    if (activeTab === "poll") {
      return (
        <PollSticker
          onSave={handlePollSave}
          onCancel={() => setShowCreator(false)}
        />
      )
    }
    if (activeTab === "question") {
      return (
        <QuestionSticker
          onSave={handleQuestionSave}
          onCancel={() => setShowCreator(false)}
        />
      )
    }
    if (activeTab === "countdown") {
      return (
        <CountdownSticker
          onSave={handleCountdownSave}
          onCancel={() => setShowCreator(false)}
        />
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="font-semibold text-lg">Add Sticker</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as StickerType)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0 rounded-none border-b">
          <TabsTrigger value="emoji" className="flex-shrink-0">
            <Smile className="h-4 w-4 mr-2" />
            Emoji
          </TabsTrigger>
          <TabsTrigger value="gif" className="flex-shrink-0">
            <ImageIcon className="h-4 w-4 mr-2" />
            GIF
          </TabsTrigger>
          <TabsTrigger value="location" className="flex-shrink-0">
            <MapPin className="h-4 w-4 mr-2" />
            Location
          </TabsTrigger>
          <TabsTrigger value="mention" className="flex-shrink-0">
            <AtSign className="h-4 w-4 mr-2" />
            Mention
          </TabsTrigger>
          <TabsTrigger value="hashtag" className="flex-shrink-0">
            <Hash className="h-4 w-4 mr-2" />
            Hashtag
          </TabsTrigger>
          <TabsTrigger value="poll" className="flex-shrink-0">
            <BarChart3 className="h-4 w-4 mr-2" />
            Poll
          </TabsTrigger>
          <TabsTrigger value="question" className="flex-shrink-0">
            <HelpCircle className="h-4 w-4 mr-2" />
            Question
          </TabsTrigger>
          <TabsTrigger value="countdown" className="flex-shrink-0">
            <Clock className="h-4 w-4 mr-2" />
            Countdown
          </TabsTrigger>
          <TabsTrigger value="music" className="flex-shrink-0" disabled>
            <Music className="h-4 w-4 mr-2" />
            Music
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex-shrink-0" disabled>
            <Brain className="h-4 w-4 mr-2" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex-shrink-0" disabled>
            <Cloud className="h-4 w-4 mr-2" />
            Weather
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="emoji" className="h-full m-0">
            <EmojiSticker onSelect={handleEmojiSelect} />
          </TabsContent>

          <TabsContent value="gif" className="h-full m-0">
            <GifSticker onSelect={handleGifSelect} />
          </TabsContent>

          <TabsContent value="location" className="h-full m-0">
            <LocationSticker onSelect={handleLocationSelect} />
          </TabsContent>

          <TabsContent value="mention" className="h-full m-0">
            <MentionSticker onSelect={handleMentionSelect} />
          </TabsContent>

          <TabsContent value="hashtag" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4">
              <Button onClick={handleHashtagClick} size="lg">
                Add Hashtag
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="poll" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4">
              <Button onClick={() => setShowCreator(true)} size="lg">
                Create Poll
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="question" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4">
              <Button onClick={() => setShowCreator(true)} size="lg">
                Ask Question
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="countdown" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4">
              <Button onClick={() => setShowCreator(true)} size="lg">
                Add Countdown
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="music" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4 text-muted-foreground">
              Music stickers coming soon
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4 text-muted-foreground">
              Quiz stickers coming soon
            </div>
          </TabsContent>

          <TabsContent value="weather" className="h-full m-0">
            <div className="flex items-center justify-center h-full p-4 text-muted-foreground">
              Weather stickers coming soon
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
