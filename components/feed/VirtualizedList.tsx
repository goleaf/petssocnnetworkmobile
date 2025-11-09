"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimatedItemHeight?: number
  overscan?: number
  className?: string
  keyExtractor?: (item: T, index: number) => string
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimatedItemHeight = 480,
  overscan = 5,
  className,
  keyExtractor,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  // Heights state; start with estimate
  const [heights, setHeights] = useState<number[]>(() => new Array(items.length).fill(estimatedItemHeight))

  // Reinitialize heights when item count changes
  useEffect(() => {
    setHeights((prev) => {
      if (prev.length === items.length) return prev
      const next = new Array(items.length).fill(estimatedItemHeight)
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i]
      return next
    })
  }, [items.length, estimatedItemHeight])

  const totalHeight = useMemo(() => heights.reduce((a, b) => a + b, 0), [heights])

  // Prefix sums for binary search
  const prefix = useMemo(() => {
    const p = new Array(heights.length + 1)
    p[0] = 0
    for (let i = 0; i < heights.length; i++) p[i + 1] = p[i] + heights[i]
    return p
  }, [heights])

  const findIndexForOffset = useCallback((offset: number) => {
    // Binary search prefix to find largest i s.t. prefix[i] <= offset
    let lo = 0, hi = prefix.length - 1
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2)
      if (prefix[mid] <= offset) lo = mid
      else hi = mid - 1
    }
    return Math.max(0, Math.min(items.length - 1, lo))
  }, [prefix, items.length])

  const bufferPx = overscan * (totalHeight > 0 && heights.length > 0 ? totalHeight / heights.length : estimatedItemHeight)
  const startIdx = useMemo(() => findIndexForOffset(Math.max(0, scrollTop - bufferPx)), [scrollTop, bufferPx, findIndexForOffset])
  const endIdx = useMemo(() => findIndexForOffset(Math.min(totalHeight, scrollTop + viewportHeight + bufferPx)), [scrollTop, viewportHeight, bufferPx, findIndexForOffset, totalHeight])

  const topSpacer = prefix[startIdx]
  const bottomSpacer = totalHeight - prefix[endIdx + 1]

  // Listen to scroll/resize (window-scrolling)
  useEffect(() => {
    const onScroll = () => setScrollTop(window.scrollY || window.pageYOffset || 0)
    const onResize = () => setViewportHeight(window.innerHeight || 0)
    onScroll()
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const setItemHeight = useCallback((index: number, h: number) => {
    setHeights((prev) => {
      if (prev[index] === h || !isFinite(h) || h <= 0) return prev
      const next = prev.slice()
      next[index] = h
      return next
    })
  }, [])

  const visible: Array<{ node: React.ReactNode; index: number; key: string }> = []
  for (let i = startIdx; i <= endIdx; i++) {
    if (i < 0 || i >= items.length) continue
    const item = items[i]
    const key = keyExtractor ? keyExtractor(item, i) : String(i)
    visible.push({ node: (
      <Measure key={key} index={i} setItemHeight={setItemHeight}>
        {renderItem(item, i)}
      </Measure>
    ), index: i, key })
  }

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div style={{ height: topSpacer }} />
      {visible.map((v) => v.node)}
      <div style={{ height: bottomSpacer }} />
    </div>
  )
}

function Measure({ index, setItemHeight, children }: { index: number; setItemHeight: (index: number, h: number) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new (window as any).ResizeObserver((entries: any[]) => {
      for (const entry of entries) {
        const h = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect?.height || el.offsetHeight
        if (h) setItemHeight(index, Math.ceil(h))
      }
    })
    try { ro.observe(el) } catch {}
    // Initial measure
    setItemHeight(index, Math.ceil(el.getBoundingClientRect().height))
    return () => {
      try { ro.disconnect() } catch {}
    }
  }, [index, setItemHeight])
  return <div ref={ref}>{children}</div>
}

export default VirtualizedList

