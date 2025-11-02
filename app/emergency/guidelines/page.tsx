"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { AlertTriangle, Heart, Eye, Thermometer, Droplet, Shield, type LucideIcon } from "lucide-react"

interface Guideline {
  id: string
  title: string
  description: string
  icon: LucideIcon
  urgency: "emergency" | "urgent" | "caution"
}

const guidelines: Guideline[] = [
  {
    id: "1",
    title: "Difficulty Breathing",
    description: "If your pet is struggling to breathe, gasping, or has blue/pale gums, this is a life-threatening emergency. Go to the nearest emergency clinic immediately.",
    icon: Heart,
    urgency: "emergency",
  },
  {
    id: "2",
    title: "Severe Trauma or Injury",
    description: "If your pet has been hit by a car, fallen from height, or sustained severe injuries with bleeding, seek immediate emergency care.",
    icon: AlertTriangle,
    urgency: "emergency",
  },
  {
    id: "3",
    title: "Loss of Consciousness",
    description: "If your pet collapses, faints, or loses consciousness, this requires immediate emergency veterinary attention.",
    icon: Eye,
    urgency: "emergency",
  },
  {
    id: "4",
    title: "Suspected Poisoning",
    description: "If you suspect your pet has ingested something toxic (chocolate, antifreeze, medications, plants), call an emergency clinic immediately. Time is critical.",
    icon: Shield,
    urgency: "emergency",
  },
  {
    id: "5",
    title: "Extreme Temperature",
    description: "Severe hypothermia or hyperthermia (heatstroke) can be life-threatening. Look for excessive panting, lethargy, or shivering in extreme conditions.",
    icon: Thermometer,
    urgency: "emergency",
  },
  {
    id: "6",
    title: "Profuse Bleeding",
    description: "If bleeding cannot be controlled with direct pressure within 5 minutes, this is an emergency. Apply pressure and go to emergency care immediately.",
    icon: Droplet,
    urgency: "emergency",
  },
  {
    id: "7",
    title: "Severe Vomiting or Diarrhea",
    description: "Multiple episodes of vomiting/diarrhea, especially with blood, or if your pet cannot keep water down, requires urgent veterinary attention.",
    icon: AlertTriangle,
    urgency: "urgent",
  },
  {
    id: "8",
    title: "Inability to Urinate",
    description: "If your pet cannot urinate or is straining without producing urine, this may indicate a blockage and requires urgent care within hours.",
    icon: Droplet,
    urgency: "urgent",
  },
  {
    id: "9",
    title: "Severe Pain",
    description: "If your pet is crying, aggressive when touched, or showing obvious signs of severe pain, seek veterinary care as soon as possible.",
    icon: Heart,
    urgency: "urgent",
  },
]

export default function EmergencyGuidelinesPage() {
  const emergencyGuidelines = guidelines.filter((g) => g.urgency === "emergency")
  const urgentGuidelines = guidelines.filter((g) => g.urgency === "urgent")

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href="/wiki" label="Back to Wiki" />

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Emergency Pet Care Guidelines</h1>
        <p className="text-muted-foreground">
          Know when to seek immediate emergency veterinary care for your pet.
        </p>
      </div>

      {/* Emergency Situations */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Life-Threatening Emergencies
        </h2>
        <p className="text-muted-foreground mb-4">
          These situations require immediate emergency veterinary care. Do not delay.
        </p>
        <div className="space-y-4">
          {emergencyGuidelines.map((guideline) => {
            const Icon = guideline.icon
            return (
              <Card
                key={guideline.id}
                className="border-red-500 bg-red-50 dark:bg-red-950"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <Icon className="h-5 w-5" />
                    {guideline.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 dark:text-red-300">{guideline.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Urgent Situations */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          Urgent Situations
        </h2>
        <p className="text-muted-foreground mb-4">
          These situations should be evaluated by a veterinarian as soon as possible, typically within 24 hours.
        </p>
        <div className="space-y-4">
          {urgentGuidelines.map((guideline) => {
            const Icon = guideline.icon
            return (
              <Card
                key={guideline.id}
                className="border-orange-500 bg-orange-50 dark:bg-orange-950"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <Icon className="h-5 w-5" />
                    {guideline.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-700 dark:text-orange-300">{guideline.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* General Advice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            General Emergency Advice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-700 dark:text-blue-300">
          <ul className="list-disc list-inside space-y-2">
            <li>Keep your pet calm and minimize movement during transport</li>
            <li>If possible, call the emergency clinic ahead to let them know you&apos;re coming</li>
            <li>Bring any medications your pet is currently taking</li>
            <li>Do not give medications unless specifically directed by a veterinarian</li>
            <li>If your pet has ingested something, bring the container or sample if safe to do so</li>
            <li>Have your pet&apos;s medical records available if possible</li>
            <li>Stay calm - your pet can sense your anxiety</li>
          </ul>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Disclaimer:</strong> This information is for educational purposes only and 
            does not replace professional veterinary care. When in doubt, always consult with a 
            veterinarian. In life-threatening emergencies, proceed to the nearest emergency 
            veterinary clinic immediately or call an emergency hotline.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

