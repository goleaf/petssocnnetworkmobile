"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  href?: string
  onClick?: () => void
  label?: string
  children?: React.ReactNode
  icon?: LucideIcon
  className?: string
}

export function BackButton({ href, onClick, label, children, icon: Icon = ArrowLeft, className }: BackButtonProps) {
  const baseClasses = "mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
  const text = label ?? (typeof children === 'string' ? children : 'Back')
  
  const content = (
    <>
      <Icon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
      <span className="text-sm font-medium">{text}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn(baseClasses, className)}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={cn(baseClasses, className)} type="button">
      {content}
    </button>
  )
}
