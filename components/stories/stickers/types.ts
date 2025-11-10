// Sticker-specific data types

export interface PollStickerData {
  question: string
  options: Array<{ id: string; text: string; votes?: number }>
  totalVotes?: number
}

export interface QuestionStickerData {
  prompt: string
  responses?: Array<{ userId: string; text: string; timestamp: string }>
}

export interface CountdownStickerData {
  targetDate: string
  label?: string
}

export interface LocationStickerData {
  name: string
  address?: string
  latitude?: number
  longitude?: number
  placeId?: string
}

export interface MentionStickerData {
  userId: string
  username: string
  avatar?: string
}

export interface GifStickerData {
  url: string
  width: number
  height: number
  title?: string
}

export type StickerType =
  | "emoji"
  | "gif"
  | "location"
  | "mention"
  | "hashtag"
  | "poll"
  | "question"
  | "countdown"
  | "music"
  | "quiz"
  | "weather"
