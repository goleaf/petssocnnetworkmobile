"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, CheckCircle2, AlertTriangle, Calendar, UserCheck, Hourglass } from "lucide-react"
import { ExpirationBadge } from "@/components/wiki/editorial-policy/expiration-badge"

export function HealthReviewSLA() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Health Review SLA</CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">
            Service Level Agreements for health article reviews and expiration management
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Review Timelines */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Hourglass className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Review Timelines</h3>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Initial Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">7 days</div>
                    <p className="text-sm text-muted-foreground">
                      New health articles must be reviewed by verified expert within 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Revision Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">3 days</div>
                    <p className="text-sm text-muted-foreground">
                      Revisions to stable health articles reviewed within 3 days
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Urgent Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">24 hours</div>
                    <p className="text-sm text-muted-foreground">
                      Emergency/urgent articles reviewed within 24 hours
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Expiration Policy */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Article Expiration & Review Cycles</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Expiration Policy</AlertTitle>
                <AlertDescription>
                  Health articles expire <strong>12 months</strong> after last expert approval. Articles must be re-reviewed before expiration to maintain &quot;stable&quot; status.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Expiration Timeline:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>
                      <strong>0-6 months:</strong> Article is current. No action required.
                      <ExpirationBadge monthsUntilExpiration={3} className="ml-2" />
                    </li>
                    <li>
                      <strong>6-9 months:</strong> Article approaching expiration. Review should be scheduled.
                      <ExpirationBadge monthsUntilExpiration={7} className="ml-2" />
                    </li>
                    <li>
                      <strong>9-12 months:</strong> Article nearing expiration. Priority review recommended.
                      <ExpirationBadge monthsUntilExpiration={10} className="ml-2" />
                    </li>
                    <li>
                      <strong>12+ months:</strong> Article expired. Must be re-reviewed before publication.
                      <ExpirationBadge monthsUntilExpiration={13} className="ml-2" />
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Review Triggers:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>New research published relevant to article topic</li>
                    <li>Regulatory changes affecting content</li>
                    <li>User reports of outdated information</li>
                    <li>Scheduled expiration (12-month cycle)</li>
                    <li>Emergency updates (e.g., product recalls, health alerts)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Expiration Badges */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Badge className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Expiration Badge System</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Badges automatically appear on health articles to indicate review status:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Badge States</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current (&lt;6 months)</span>
                      <ExpirationBadge monthsUntilExpiration={3} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Approaching (6-9 months)</span>
                      <ExpirationBadge monthsUntilExpiration={7} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expiring Soon (9-12 months)</span>
                      <ExpirationBadge monthsUntilExpiration={10} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expired (12+ months)</span>
                      <ExpirationBadge monthsUntilExpiration={13} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Badge Display Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Badges appear in article header</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Color-coded for quick recognition</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Hover shows exact expiration date</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Click badge for review request form</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Expert Reviewer Requirements */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Expert Reviewer Requirements</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Qualified Reviewers:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Licensed veterinarians (DVM, VMD, or equivalent)</li>
                    <li>Veterinary specialists (board-certified)</li>
                    <li>Veterinary researchers with relevant expertise</li>
                    <li>Must be verified through expert verification system</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Review Process:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Reviewer assigned based on expertise area</li>
                    <li>Reviewer confirms content accuracy and currency</li>
                    <li>Reviewer approves or requests changes</li>
                    <li>Approved articles marked as &quot;stable&quot; with reviewer ID</li>
                    <li>Review timestamp recorded for expiration calculation</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* SLA Compliance */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">SLA Compliance & Escalation</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Timeline Violations</AlertTitle>
                <AlertDescription>
                  If review timelines are not met, articles are automatically flagged for moderator escalation. 
                  Urgent articles exceeding 24-hour review window may be temporarily unpublished until review completion.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Escalation Process:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Automated reminder sent to assigned reviewer at 50% of SLA time</li>
                    <li>Escalation to moderator queue at 80% of SLA time</li>
                    <li>Article flagged as &quot;review overdue&quot; at 100% of SLA time</li>
                    <li>Moderator assigns alternative reviewer if original unavailable</li>
                    <li>Emergency articles may bypass normal queue with moderator approval</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

