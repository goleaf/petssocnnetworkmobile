"use client"

import { type Environment } from "@/lib/types/ops"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

interface EnvBannerProps {
  environment: Environment
}

export function EnvBanner({ environment }: EnvBannerProps) {
  const envConfig = {
    production: {
      label: "Production",
      color: "bg-red-600",
      icon: AlertTriangle,
      textColor: "text-white",
    },
    staging: {
      label: "Staging",
      color: "bg-yellow-500",
      icon: Info,
      textColor: "text-white",
    },
    development: {
      label: "Development",
      color: "bg-blue-500",
      icon: CheckCircle2,
      textColor: "text-white",
    },
  }

  const config = envConfig[environment]
  const Icon = config.icon

  return (
    <div className={`${config.color} ${config.textColor} px-4 py-2 rounded-lg flex items-center gap-2 shadow-md`}>
      <Icon className="w-5 h-5" />
      <span className="font-semibold">{config.label} Environment</span>
    </div>
  )
}

