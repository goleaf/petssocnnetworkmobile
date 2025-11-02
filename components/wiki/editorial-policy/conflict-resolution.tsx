"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, Users, MessageSquare, FileText, Scale, ArrowRight } from "lucide-react"

export function ConflictResolution() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Conflict Resolution</CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">
            Processes for resolving editorial disputes and RFC timelines
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RFC Process */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Request for Comments (RFC) Process</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>RFC Purpose</AlertTitle>
                <AlertDescription>
                  RFCs allow community discussion and consensus-building for significant content changes, 
                  policy updates, or controversial edits before implementation.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">When to Create an RFC:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Major content restructure or rewrite</li>
                    <li>Controversial claims or disputed information</li>
                    <li>Policy interpretation disputes</li>
                    <li>New editorial guidelines or standards</li>
                    <li>Source conflicts (multiple credible sources disagree)</li>
                    <li>Editorial style disagreements</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">RFC Timeline:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-background rounded border">
                      <div className="flex-shrink-0">
                        <Badge variant="outline">Step 1</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">Draft Period (3 days)</div>
                        <p className="text-sm text-muted-foreground">
                          RFC posted for initial community review. Author may refine based on early feedback.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-background rounded border">
                      <div className="flex-shrink-0">
                        <Badge variant="outline">Step 2</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">Discussion Period (7 days)</div>
                        <p className="text-sm text-muted-foreground">
                          Community discussion, feedback, and alternative proposals. Author responds to comments.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-background rounded border">
                      <div className="flex-shrink-0">
                        <Badge variant="outline">Step 3</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">Resolution Period (3 days)</div>
                        <p className="text-sm text-muted-foreground">
                          Moderator review, consensus building, and final decision. Implementation or closure.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Total RFC Timeline: 13 days</strong> (may be extended for complex issues)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Moderator Escalation */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Moderator Escalation</h3>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Escalation Triggers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>RFC reaches deadline without consensus</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>Personal attacks or harassment in discussions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>Repeated edit wars (3+ reverts)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>Policy violations or rule disputes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>Content safety concerns</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Moderator Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Extend RFC discussion period if needed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Scale className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Make final decision based on policy</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Mediate between conflicting parties</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Issue warnings or temporary restrictions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Document resolution for future reference</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Edit War Prevention */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Edit War Prevention</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Three-Revert Rule</AlertTitle>
                <AlertDescription>
                  After three reverts of the same content by different editors, the article is automatically 
                  protected and escalated to moderators. Further edits require RFC or moderator approval.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Prevention Measures:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Editors must provide clear rationale in edit summaries</li>
                    <li>Disputed edits should move to article discussion/comments</li>
                    <li>RFC should be created if dispute persists after 2 reverts</li>
                    <li>Moderators can temporarily protect articles during disputes</li>
                    <li>Repeated edit war participants may face temporary editing restrictions</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Appeal Process */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Appeal Process</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Appeal Timeline:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <strong>Appeal Submission (within 7 days)</strong>
                      <p className="text-muted-foreground ml-6 mt-1">
                        User submits appeal with evidence and rationale
                      </p>
                    </li>
                    <li>
                      <strong>Review Period (5 days)</strong>
                      <p className="text-muted-foreground ml-6 mt-1">
                        Moderator reviews appeal, original decision, and evidence
                      </p>
                    </li>
                    <li>
                      <strong>Decision Notification (2 days)</strong>
                      <p className="text-muted-foreground ml-6 mt-1">
                        Moderator provides decision and reasoning
                      </p>
                    </li>
                    <li>
                      <strong>Final Appeal (optional, 7 days)</strong>
                      <p className="text-muted-foreground ml-6 mt-1">
                        May escalate to admin team for final review
                      </p>
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Appeal Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Clear explanation of why decision was incorrect</li>
                    <li>Evidence supporting appeal (sources, policy references)</li>
                    <li>Proposed resolution or compromise</li>
                    <li>Appeals must be respectful and constructive</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Conflict of Interest */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Conflict of Interest (COI) Handling</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>COI Disclosure</AlertTitle>
                <AlertDescription>
                  Editors with financial or professional relationships to brands, products, or organizations 
                  must disclose conflicts when editing related content. Undisclosed COIs may result in edit reversions.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">COI Scenarios:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Employee of pet food company editing nutrition articles</li>
                    <li>Veterinarian promoting their own clinic or services</li>
                    <li>Brand affiliate editing product articles</li>
                    <li>Competitor editing competitor&apos;s product pages</li>
                    <li>Financial interest in mentioned products or services</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">COI Resolution:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Disclose COI in edit summary or article discussion</li>
                    <li>Moderator review for significant COIs</li>
                    <li>Third-party editor assigned for contested edits</li>
                    <li>COI flags added to article metadata</li>
                    <li>Repeat violations may result in editing restrictions</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

