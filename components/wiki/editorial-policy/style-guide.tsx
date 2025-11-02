"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, Target, MessageSquare, Ruler, CheckCircle2 } from "lucide-react"

export function StyleGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Style Guide</CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">
            Standards for writing quality, accessible wiki articles
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reading Level */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Reading Level</h3>
            </div>
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Target Reading Level</AlertTitle>
                <AlertDescription>
                  All wiki articles should target a <strong>Flesch-Kincaid Grade Level of 8-10</strong> (approximately 8th to 10th grade reading level).
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Guidelines:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Use simple, clear sentences (average 15-20 words)</li>
                    <li>Avoid jargon; define technical terms when first used</li>
                    <li>Prefer active voice over passive voice</li>
                    <li>Use everyday language when possible</li>
                    <li>Break complex concepts into shorter paragraphs</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Health Articles:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>May use more technical terms, but must include plain-language explanations</li>
                    <li>Define medical terms in context</li>
                    <li>Use layperson-friendly analogies for complex concepts</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tone */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Tone & Voice</h3>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">✅ Do</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Professional and informative</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Empathetic and supportive</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Clear and direct</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Objective and evidence-based</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Respectful of pet owners&apos; experiences</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">❌ Don&apos;t</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Alarmist or fear-mongering</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Judgmental or condescending</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Overly casual or unprofessional</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Promotional or sales-oriented</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Making definitive medical diagnoses</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Health Article Tone</AlertTitle>
                <AlertDescription>
                  Health articles must always emphasize consulting a veterinarian. Use phrases like &quot;may indicate&quot; rather than &quot;is&quot; or &quot;means&quot;. Never provide definitive diagnoses or treatment recommendations without veterinary consultation.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Unit Usage */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Unit Usage</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Primary Units:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Weight:</strong> Metric (kg, g) with Imperial in parentheses: &quot;5 kg (11 lbs)&quot;</li>
                    <li><strong>Length/Height:</strong> Metric (cm, m) with Imperial: &quot;45 cm (18 in)&quot;</li>
                    <li><strong>Temperature:</strong> Celsius (°C) with Fahrenheit: &quot;38°C (100.4°F)&quot;</li>
                    <li><strong>Volume:</strong> Metric (ml, L) with Imperial: &quot;250 ml (8.5 fl oz)&quot;</li>
                    <li><strong>Dosage:</strong> Metric units (mg/kg, ml/kg) with conversions when helpful</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Formatting:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Use spaces between numbers and units: &quot;5 kg&quot; not &quot;5kg&quot;</li>
                    <li>Use non-breaking spaces (&nbsp;) for critical measurements</li>
                    <li>Include both systems for the first mention, then use primary system</li>
                    <li>For health articles, always include both systems for critical measurements</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Consistency</AlertTitle>
                <AlertDescription>
                  Within a single article, maintain consistent unit usage. If an article primarily uses metric, convert all measurements to metric first, then Imperial.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Language & Accessibility */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Language & Accessibility</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Accessibility Guidelines:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Use descriptive headings (H2, H3) to structure content</li>
                    <li>Include alt text for all images</li>
                    <li>Use lists for sequential information</li>
                    <li>Avoid color-only indicators (use icons + text)</li>
                    <li>Ensure sufficient color contrast (WCAG AA minimum)</li>
                    <li>Use plain language for critical safety information</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Language Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Primary language: English (US spelling)</li>
                    <li>Use consistent terminology throughout article</li>
                    <li>Define abbreviations on first use</li>
                    <li>Avoid idioms and cultural references that may not translate</li>
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

