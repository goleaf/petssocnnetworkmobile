"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Captions } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VideoQuality, VideoCaptionTrack } from "@/lib/types"

interface VideoSource {
  src: string
  quality: VideoQuality
}

interface VideoPlayerProps {
  sources: VideoSource[]
  poster?: string
  captions?: VideoCaptionTrack[]
  autoPlayInView?: boolean
}

export function VideoPlayer({ sources, poster, captions = [], autoPlayInView = true }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(0.7)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [quality, setQuality] = useState<VideoQuality>('auto')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ccEnabled, setCcEnabled] = useState(false)

  const byQuality = useMemo(() => {
    const map = new Map<VideoQuality, string>()
    for (const s of sources) map.set(s.quality, s.src)
    // fallbacks
    if (!map.get('auto')) map.set('auto', sources[0]?.src || '')
    return map
  }, [sources])

  const currentSrc = byQuality.get(quality) || byQuality.get('auto') || ''

  // Set up intersection observer for lazy load + autoplay with 500ms dwell
  useEffect(() => {
    if (!autoPlayInView) return
    const el = containerRef.current
    const vid = videoRef.current
    if (!el || !vid) return
    let dwellTimer: ReturnType<typeof setTimeout> | null = null
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const ratio = entry.intersectionRatio
      // Lazy activate loading once slightly visible
      if (ratio >= 0.1 && !vid.src) {
        vid.preload = 'metadata'
        vid.src = currentSrc
        try { vid.load() } catch {}
      }
      if (ratio >= 0.5 && entry.isIntersecting) {
        if (dwellTimer) clearTimeout(dwellTimer)
        dwellTimer = setTimeout(() => {
          // Autoplay muted if still in view after dwell
          const stillVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5
          if (stillVisible) {
            vid.muted = true
            setMuted(true)
            vid.play().then(() => setPlaying(true)).catch(() => {})
          }
        }, 500)
      } else {
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null }
        vid.pause()
        setPlaying(false)
      }
    }, { threshold: [0, 0.1, 0.5, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [autoPlayInView])

  // Wire basic events
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setTime(vid.currentTime)
    const onLoaded = () => setDuration(vid.duration || 0)
    vid.addEventListener('play', onPlay)
    vid.addEventListener('pause', onPause)
    vid.addEventListener('timeupdate', onTime)
    vid.addEventListener('loadedmetadata', onLoaded)
    return () => {
      vid.removeEventListener('play', onPlay)
      vid.removeEventListener('pause', onPause)
      vid.removeEventListener('timeupdate', onTime)
      vid.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [currentSrc])

  // Handle quality change preserving time
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const t = time
    if (!vid.src) return
    vid.src = currentSrc
    const onLoaded = () => { vid.currentTime = Math.min(t, vid.duration || t); if (playing) vid.play().catch(()=>{}) }
    vid.addEventListener('loadedmetadata', onLoaded, { once: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality])

  // Apply captions (inline vtt blobs supported)
  const trackUrls = useMemo(() => {
    return captions.map((c) => {
      if (c.srcVtt) return { ...c, url: c.srcVtt }
      if (c.vtt) {
        const blob = new Blob([c.vtt], { type: 'text/vtt' })
        return { ...c, url: URL.createObjectURL(blob), _blob: true as const }
      }
      return null
    }).filter(Boolean) as Array<VideoCaptionTrack & { url: string; _blob?: true }>
  }, [captions])

  useEffect(() => {
    return () => {
      // Revoke any blob URLs
      trackUrls.forEach((t) => { if ((t as any)._blob) URL.revokeObjectURL(t.url) })
    }
  }, [trackUrls])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (playing) vid.pause(); else vid.play().catch(()=>{})
  }
  const toggleMute = () => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = !vid.muted
    setMuted(vid.muted)
    if (!vid.muted && !playing) vid.play().catch(()=>{})
  }
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const v = Number(e.target.value)
    vid.currentTime = v
    setTime(v)
  }
  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const v = Number(e.target.value)
    vid.volume = v
    setVolume(v)
    if (v === 0 && !muted) { vid.muted = true; setMuted(true) }
    if (v > 0 && muted) { vid.muted = false; setMuted(false) }
  }
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${m}:${ss.toString().padStart(2,'0')}`
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(()=>setIsFullscreen(true)).catch(()=>{})
    } else {
      document.exitFullscreen?.().then(()=>setIsFullscreen(false)).catch(()=>{})
    }
  }

  // Toggle first text track for CC
  const toggleCc = () => {
    const vid = videoRef.current
    if (!vid) return
    const tracks = vid.textTracks
    if (!tracks || tracks.length === 0) return
    const t = tracks[0]
    t.mode = t.mode === 'showing' ? 'disabled' : 'showing'
    setCcEnabled(t.mode === 'showing')
  }

  return (
    <div ref={containerRef} className="relative group rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        // src set lazily when in view
        poster={poster}
        className="w-full h-auto"
        playsInline
        muted={muted}
        onClick={toggleMute}
        preload="none"
      >
        {trackUrls.map((t, idx) => (
          <track key={idx} kind="subtitles" srcLang={t.lang} label={t.label} src={t.url} default={idx === 0} />
        ))}
      </video>

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-white">{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
          <input type="range" min={0} max={Math.max(1, duration)} step={0.1} value={time} onChange={onSeek} className="flex-1" />
          <span className="text-white text-xs w-16 text-right">{fmt(time)} / {fmt(duration)}</span>
          <button onClick={toggleMute} className="text-white">{muted || volume===0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={onVolume} className="w-20" />
          {sources.length > 1 && (
            <div className="relative">
              <select value={quality} onChange={(e) => setQuality(e.target.value as VideoQuality)} className="text-white bg-transparent text-sm">
                {['auto','480p','720p','1080p'].filter(q => byQuality.get(q as VideoQuality)).map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          )}
          {captions.length > 0 && (
            <button onClick={toggleCc} className={cn("text-white", ccEnabled && 'text-primary')}> <Captions className="h-5 w-5" /> </button>
          )}
          <button onClick={toggleFullscreen} className="text-white">{isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</button>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
