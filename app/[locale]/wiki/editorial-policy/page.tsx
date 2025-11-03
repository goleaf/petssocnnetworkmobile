"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackButton } from "@/components/ui/back-button"
import { BookOpen, FileText, Clock, AlertTriangle, Image as ImageIcon, Scale, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { StyleGuide } from "@/components/wiki/editorial-policy/style-guide"
import { SourcingRules } from "@/components/wiki/editorial-policy/sourcing-rules"
import { HealthReviewSLA } from "@/components/wiki/editorial-policy/health-review-sla"
import { ConflictResolution } from "@/components/wiki/editorial-policy/conflict-resolution"
import { ImagePolicy } from "@/components/wiki/editorial-policy/image-policy"

export default function EditorialPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <BackButton href="/wiki" label="Back to Wiki" />
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Editorial Policy Kit</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Comprehensive guidelines for wiki contributors and editors
            </p>
          </div>
        </div>
        
        <Badge variant="secondary" className="text-sm">
          Official Policy Document
        </Badge>
      </div>

      <Tabs defaultValue="style-guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
          <TabsTrigger value="style-guide" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Style Guide</span>
          </TabsTrigger>
          <TabsTrigger value="sourcing" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Sourcing</span>
          </TabsTrigger>
          <TabsTrigger value="health-review" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Health Review</span>
          </TabsTrigger>
          <TabsTrigger value="conflict-resolution" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Conflict</span>
          </TabsTrigger>
          <TabsTrigger value="image-policy" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Images</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style-guide">
          <StyleGuide />
        </TabsContent>

        <TabsContent value="sourcing">
          <SourcingRules />
        </TabsContent>

        <TabsContent value="health-review">
          <HealthReviewSLA />
        </TabsContent>

        <TabsContent value="conflict-resolution">
          <ConflictResolution />
        </TabsContent>

        <TabsContent value="image-policy">
          <ImagePolicy />
        </TabsContent>
      </Tabs>
    </div>
  )
}

