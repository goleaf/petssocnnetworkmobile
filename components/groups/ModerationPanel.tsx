"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MemberModeration } from "./MemberModeration"
import { ContentModeration } from "./ContentModeration"
import { getModerationActionsByGroupId, getUserById } from "@/lib/storage"
import type { Group, ModerationAction } from "@/lib/types"
import { Users, Shield, FileText, Download } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ModerationPanelProps {
  group: Group
  currentUserId: string
}

export function ModerationPanel({ group, currentUserId }: ModerationPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAction = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const moderationLog = getModerationActionsByGroupId(group.id)

  const handleExportLog = () => {
    const csvLines: string[] = []
    csvLines.push("Action Type,Target Type,Target ID,Performed By,Reason,Timestamp")
    moderationLog.forEach((action) => {
      const user = getUserById(action.performedBy)
      csvLines.push(
        `${action.actionType},${action.targetType},${action.targetId},${
          user?.username || action.performedBy
        },"${action.reason || ""}",${action.timestamp}`
      )
    })

    const csv = csvLines.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${group.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_moderation_log.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case "ban":
        return "destructive"
      case "warn":
        return "default"
      case "unban":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="log">
            <Shield className="h-4 w-4 mr-2" />
            Moderation Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MemberModeration
            key={refreshKey}
            group={group}
            currentUserId={currentUserId}
            onMemberAction={handleAction}
          />
        </TabsContent>

        <TabsContent value="content">
          <ContentModeration
            key={refreshKey}
            group={group}
            currentUserId={currentUserId}
            onContentAction={handleAction}
          />
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Moderation Log</CardTitle>
                <Button onClick={handleExportLog} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {moderationLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No moderation actions recorded
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target Type</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moderationLog.map((action) => {
                      const user = getUserById(action.performedBy)
                      return (
                        <TableRow key={action.id}>
                          <TableCell>
                            {new Date(action.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(action.actionType)}>
                              {action.actionType.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{action.targetType}</TableCell>
                          <TableCell>
                            {user?.username || `User ${action.performedBy.slice(0, 8)}`}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {action.reason || "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

