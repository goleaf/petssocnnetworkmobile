"use client"

import { useState } from "react"
import { generateManyGroups, generateGroupsForCategory } from "@/lib/generate-many-groups"
import { getAllGroups } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const animalTypes = [
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "bird", label: "Birds" },
  { value: "rabbit", label: "Rabbits" },
  { value: "hamster", label: "Hamsters" },
  { value: "fish", label: "Fish" },
  { value: "turtle", label: "Turtles" },
  { value: "snake", label: "Snakes" },
  { value: "lizard", label: "Lizards" },
  { value: "guinea-pig", label: "Guinea Pigs" },
  { value: "ferret", label: "Ferrets" },
  { value: "chinchilla", label: "Chinchillas" },
  { value: "hedgehog", label: "Hedgehogs" },
  { value: "gerbil", label: "Gerbils" },
  { value: "mouse", label: "Mice" },
  { value: "rat", label: "Rats" },
]

const animalCategoryMap: Record<string, string> = {
  dog: "cat-dogs",
  cat: "cat-cats",
  bird: "cat-birds",
  rabbit: "cat-rabbits",
  hamster: "cat-hamsters",
  fish: "cat-fish",
  turtle: "cat-turtles",
  snake: "cat-snakes",
  lizard: "cat-lizards",
  "guinea-pig": "cat-guinea-pigs",
  ferret: "cat-ferrets",
  chinchilla: "cat-chinchillas",
  hedgehog: "cat-hedgehogs",
  gerbil: "cat-gerbils",
  mouse: "cat-mice",
  rat: "cat-rats",
}

export default function GenerateGroupsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    totalGenerated?: number
    groupsByAnimal?: Record<string, number>
    errors?: string[]
    message?: string
  } | null>(null)
  const [groupsPerAnimal, setGroupsPerAnimal] = useState("50")
  const [selectedAnimalType, setSelectedAnimalType] = useState<string>("")
  const [customCount, setCustomCount] = useState("50")

  const currentGroupCount = getAllGroups().length

  const handleGenerateAll = () => {
    setIsGenerating(true)
    setResult(null)

    try {
      const count = parseInt(groupsPerAnimal, 10)
      if (isNaN(count) || count < 1) {
        setResult({
          success: false,
          errors: ["Invalid number of groups per animal"],
        })
        setIsGenerating(false)
        return
      }

      const result = generateManyGroups(count)
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateForAnimal = () => {
    if (!selectedAnimalType) {
      setResult({
        success: false,
        errors: ["Please select an animal type"],
      })
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const count = parseInt(customCount, 10)
      if (isNaN(count) || count < 1) {
        setResult({
          success: false,
          errors: ["Invalid number of groups"],
        })
        setIsGenerating(false)
        return
      }

      const categoryId = animalCategoryMap[selectedAnimalType]
      if (!categoryId) {
        setResult({
          success: false,
          errors: [`Invalid animal type: ${selectedAnimalType}`],
        })
        setIsGenerating(false)
        return
      }

      const generated = generateGroupsForCategory(selectedAnimalType, count, categoryId)
      setResult({
        success: true,
        totalGenerated: generated,
        message: `Generated ${generated} groups for ${animalTypes.find((a) => a.value === selectedAnimalType)?.label}`,
      })
    } catch (error) {
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Generate Groups</h1>
        <p className="text-muted-foreground">
          Generate many groups for testing and development. Current groups in system:{" "}
          <strong>{currentGroupCount}</strong>
        </p>
      </div>

      <div className="space-y-6">
        {/* Generate All Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Groups for All Animal Types</CardTitle>
            <CardDescription>
              Generate groups across all animal categories. This will create groups for dogs, cats,
              birds, rabbits, and all other animal types.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupsPerAnimal">Groups per Animal Type</Label>
              <Input
                id="groupsPerAnimal"
                type="number"
                min="1"
                max="1000"
                value={groupsPerAnimal}
                onChange={(e) => setGroupsPerAnimal(e.target.value)}
                placeholder="50"
              />
              <p className="text-sm text-muted-foreground">
                This will generate {parseInt(groupsPerAnimal) || 0} groups × {animalTypes.length}{" "}
                animal types = {(parseInt(groupsPerAnimal) || 0) * animalTypes.length} total groups
              </p>
            </div>
            <Button onClick={handleGenerateAll} disabled={isGenerating} className="w-full">
              {isGenerating ? "Generating..." : `Generate All Groups`}
            </Button>
          </CardContent>
        </Card>

        {/* Generate for Specific Animal Type */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Groups for Specific Animal Type</CardTitle>
            <CardDescription>
              Generate groups for a specific animal type only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="animalType">Animal Type</Label>
              <select
                id="animalType"
                value={selectedAnimalType}
                onChange={(e) => setSelectedAnimalType(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">Select an animal type</option>
                {animalTypes.map((animal) => (
                  <option key={animal.value} value={animal.value}>
                    {animal.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customCount">Number of Groups</Label>
              <Input
                id="customCount"
                type="number"
                min="1"
                max="1000"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                placeholder="50"
              />
            </div>
            <Button
              onClick={handleGenerateForAnimal}
              disabled={isGenerating || !selectedAnimalType}
              className="w-full"
            >
              {isGenerating ? "Generating..." : `Generate Groups`}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? "text-green-600" : "text-red-600"}>
                {result.success ? "Success!" : "Error"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  {result.message && <p className="font-medium">{result.message}</p>}
                  {result.totalGenerated !== undefined && (
                    <p>Total groups generated: {result.totalGenerated}</p>
                  )}
                  {result.groupsByAnimal && (
                    <div>
                      <p className="font-medium mb-2">Groups by Animal Type:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(result.groupsByAnimal).map(([animal, count]) => (
                          <li key={animal}>
                            {animalTypes.find((a) => a.value === animal)?.label || animal}: {count}{" "}
                            groups
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-4">
                    Current total groups in system: {getAllGroups().length}
                  </p>
                </div>
              ) : (
                <div>
                  {result.errors && result.errors.length > 0 && (
                    <div>
                      <p className="font-medium text-red-600 mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

