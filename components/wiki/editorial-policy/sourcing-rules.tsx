"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Scale, BookOpen, FileText, Building2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react"

export function SourcingRules() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Sourcing Rules</CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">
            Standards for credible sources and proper citation formats
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preferred Sources */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Preferred Sources</h3>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Tier 1: Highest Priority
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Peer-reviewed journals:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>Journal of Veterinary Internal Medicine</li>
                        <li>Journal of the American Veterinary Medical Association</li>
                        <li>Veterinary Medicine and Science</li>
                        <li>Animal Welfare journals</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Professional organizations:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>American Veterinary Medical Association (AVMA)</li>
                        <li>American Animal Hospital Association (AAHA)</li>
                        <li>World Small Animal Veterinary Association (WSAVA)</li>
                        <li>Federation of European Companion Animal Veterinary Associations</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Government agencies:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>FDA (Food and Drug Administration)</li>
                        <li>USDA (United States Department of Agriculture)</li>
                        <li>CDC (Centers for Disease Control)</li>
                        <li>European Food Safety Authority (EFSA)</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Tier 2: Acceptable
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Reputable veterinary schools:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>Veterinary university websites</li>
                        <li>Veterinary teaching hospital resources</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Established veterinary websites:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>VCA Animal Hospitals</li>
                        <li>Merck Veterinary Manual</li>
                        <li>Cornell University College of Veterinary Medicine</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Recognized breed clubs:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>American Kennel Club (AKC)</li>
                        <li>The Cat Fanciers&apos; Association (CFA)</li>
                        <li>Breed-specific parent clubs</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Tier 3: Use with Caution
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>These sources may be used but require additional verification:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Well-established pet care blogs with credentialed authors</li>
                    <li>Reputable pet care organizations (e.g., ASPCA, Humane Society)</li>
                    <li>Veterinary clinic websites (prefer those with credentials listed)</li>
                  </ul>
                  <p className="mt-2 font-semibold">Always verify claims with Tier 1 or Tier 2 sources when possible.</p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Not Acceptable
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Personal blogs without credentials</li>
                    <li>Social media posts</li>
                    <li>Forums and discussion boards</li>
                    <li>Unverified websites</li>
                    <li>Wikipedia (as a primary source)</li>
                    <li>Commercial product websites (unless citing specific studies)</li>
                    <li>AI-generated content</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Citation Formats */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Citation Formats</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Journal Articles:</h4>
                  <div className="bg-background p-3 rounded border text-sm font-mono">
                    Author, A. A., & Author, B. B. (Year). Article title. <em>Journal Name</em>, <em>Volume</em>(Issue), Pages. DOI or URL
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: Smith, J., & Jones, M. (2023). Canine nutrition guidelines. <em>Journal of Veterinary Nutrition</em>, 45(2), 123-145. https://doi.org/10.1234/jvn.2023.123
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Organization Websites:</h4>
                  <div className="bg-background p-3 rounded border text-sm font-mono">
                    Organization Name. (Year, Month Day). Page title. <em>Website Name</em>. URL
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: American Veterinary Medical Association. (2024, January 15). Pet care guidelines. <em>AVMA</em>. https://www.avma.org/resources/pet-care
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Veterinary Clinics:</h4>
                  <div className="bg-background p-3 rounded border text-sm font-mono">
                    Clinic Name. (Year). Article/page title. [Clinic Website]. URL. [Verified: Date]
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: Cornell University Veterinary Hospital. (2024). Feline health resources. [Cornell Vet Hospital]. https://www.vet.cornell.edu/feline-health. [Verified: 2024-03-15]
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Government Regulations:</h4>
                  <div className="bg-background p-3 rounded border text-sm font-mono">
                    Agency Name. (Year). Regulation title. <em>Code/Regulation Number</em>. URL
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: FDA. (2023). Pet food safety regulations. <em>21 CFR Part 507</em>. https://www.fda.gov/animal-veterinary/pet-food-safety
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Inline Citations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Inline Citation Guidelines</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Citation Requirements</AlertTitle>
                <AlertDescription>
                  All factual claims, statistics, and health information must be cited. Use superscript numbers [1] or inline citations [citation needed] markers.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">When to Cite:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Health-related claims (symptoms, treatments, risks)</li>
                    <li>Statistics and research findings</li>
                    <li>Regulatory information</li>
                    <li>Breed-specific information</li>
                    <li>Nutritional recommendations</li>
                    <li>Training methodologies</li>
                    <li>Controversial or disputed claims</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Citation Placement:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Place citations immediately after the claim or at the end of the sentence</li>
                    <li>Use [1], [2], [3] format for numbered citations</li>
                    <li>Use [citation needed] for places requiring sources</li>
                    <li>Group multiple citations: [1][2][3]</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Source Verification */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Source Verification</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Verification Checklist:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Check publication date (prefer sources within last 5 years for health articles)</li>
                    <li>Verify author credentials (veterinarian, researcher, recognized expert)</li>
                    <li>Confirm organization legitimacy</li>
                    <li>Check for potential conflicts of interest</li>
                    <li>Verify URL accessibility and permanence</li>
                    <li>Look for peer review status (for journal articles)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Broken Links:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>When a source link breaks, mark it as &quot;broken&quot; in citation metadata</li>
                    <li>Try to find archived version (Wayback Machine)</li>
                    <li>If unavailable, replace with equivalent source or mark [citation needed]</li>
                    <li>Periodic link checking should be performed (see Health Review SLA)</li>
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

