import type { ReactNode } from "react"
import SettingsSidebar from "@/components/settings/SettingsSidebar"

export default function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { locale: string }
}): JSX.Element {
  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
      <div className="flex gap-6">
        <SettingsSidebar locale={params.locale} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
