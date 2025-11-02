"use client"

import type { ReputationPoints } from "@/lib/types"
import { ReputationBadge } from "./reputation-badge"
import { getUserBadges } from "@/lib/reputation"

interface ReputationDisplayProps {
  reputation: ReputationPoints
  userId: string
  className?: string
}

export function ReputationDisplay({
  reputation,
  userId,
  className,
}: ReputationDisplayProps) {
  const badges = getUserBadges(userId)

  const getLevelColor = (level: ReputationPoints["level"]) => {
    switch (level) {
      case "master":
        return "text-purple-600"
      case "expert":
        return "text-blue-600"
      case "editor":
        return "text-green-600"
      case "contributor":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm text-gray-600">Reputation Level</div>
          <div className={`text-lg font-semibold ${getLevelColor(reputation.level)}`}>
            {reputation.level.charAt(0).toUpperCase() + reputation.level.slice(1)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Points</div>
          <div className="text-lg font-semibold">{reputation.totalPoints}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Accepted Edits</div>
          <div className="font-semibold">{reputation.acceptedEdits}</div>
        </div>
        <div>
          <div className="text-gray-600">Citations</div>
          <div className="font-semibold">{reputation.acceptedCitations}</div>
        </div>
        <div>
          <div className="text-gray-600">Expert Reviews</div>
          <div className="font-semibold">{reputation.expertReviews}</div>
        </div>
      </div>

      {badges.length > 0 && (
        <div>
          <div className="text-sm text-gray-600 mb-2">Badges</div>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <ReputationBadge key={badge.id} type={badge.type} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

