"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer"
import { cn } from "@/lib/utils"

interface LazyVideoProps {
  src: string
  thumbnail?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  autoPlay?: boolean
  controls?: boolean
  muted?: boolean
  loop?: boolean
}

export function LazyVideo({
  src,
  thumbnail,
  alt = "Video",
  className,
  style,
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false,
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [visibilityTimer, setVisibilityTimer] = useState<NodeJS.Timeout | null>(null)

  // Observe when video is 50% visible
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: "0px",
  })

  // Load video when 50% visible for 500ms
  useEffect(() => {
    if (isVisible && !shouldLoadVideo) {
      const timer = setTimeout(() => {
        setShouldLoadVideo(true)
      }, 500)
      setVisibilityTimer(timer)
    } else if (!isVisible && visibilityTimer) {
      clearTimeout(visibilityTimer)
      setVisibilityTimer(null)
    }

    return () => {
      if (visibilityTimer) {
        clearTimeout(visibilityTimer)
      }
    }
  }, [isVisible, shouldLoadVideo, visibilityTimer])

  // Pause video when scrolled out of view
  useEffect(() => {
    if (!isVisible && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isVisible])

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      // If video not loaded yet, load it and play
      setShouldLoadVideo(true)
      setIsPlaying(true)
    }
  }

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} style={style}>
      {!shouldLoadVideo || !isPlaying ? (
        // Show thumbnail with play button
        <div className="relative">
          {thumbnail && (
            <Image
              src={thumbnail}
              alt={alt}
              width={720}
              height={480}
              className="w-full h-auto object-cover"
              priority={false}
            />
          )}
          {!thumbnail && (
            <div className="w-full aspect-video bg-muted animate-pulse" />
          )}
          <button
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            aria-label="Play video"
          >
            <div className="bg-white/90 rounded-full p-4">
              <Play className="h-8 w-8 text-black fill-black" />
            </div>
          </button>
        </div>
      ) : (
        // Show actual video
        <video
          ref={videoRef}
          src={src}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          className="w-full h-auto"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          style={{ maxHeight: "600px" }}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  )
}
