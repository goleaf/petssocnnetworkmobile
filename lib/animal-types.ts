import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import type { LucideIcon } from "lucide-react"
import {
  faDog,
  faCat,
  faDove,
  faFish,
  faShieldDog,
  faPaw,
  faCircleDot as faCircleDotSolid,
  faSpider,
  faWorm,
  faMouse,
} from "@fortawesome/free-solid-svg-icons"

// faRat doesn't exist in FontAwesome free-solid-svg-icons, using faMouse as substitute
const faRat = faMouse
// Using faMouse for gerbil as well (similar small rodent)
const faGerbil = faMouse

import {
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  Turtle,
  CircleDot,
  Heart,
  Activity,
  Sparkles,
} from "lucide-react"

export interface AnimalTypeConfig {
  value: string
  label: string
  // FontAwesome icon (for FontAwesome usage)
  faIcon: IconDefinition
  // Lucide React icon component (for Lucide usage)
  lucideIcon: LucideIcon
  color: string
  bgColor: string
}

export const ANIMAL_TYPES: AnimalTypeConfig[] = [
  {
    value: "dog",
    label: "Dogs",
    faIcon: faDog,
    lucideIcon: Dog,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
  },
  {
    value: "cat",
    label: "Cats",
    faIcon: faCat,
    lucideIcon: Cat,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    value: "bird",
    label: "Birds",
    faIcon: faDove,
    lucideIcon: Bird,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  {
    value: "rabbit",
    label: "Rabbits",
    faIcon: faPaw,
    lucideIcon: Rabbit,
    color: "text-pink-500",
    bgColor: "bg-pink-100 dark:bg-pink-900/20",
  },
  {
    value: "hamster",
    label: "Hamsters",
    faIcon: faPaw,
    lucideIcon: CircleDot,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    value: "fish",
    label: "Fish",
    faIcon: faFish,
    lucideIcon: Fish,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
  },
  {
    value: "turtle",
    label: "Turtles",
    faIcon: faCircleDotSolid,
    lucideIcon: Turtle,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    value: "snake",
    label: "Snakes",
    faIcon: faWorm,
    lucideIcon: CircleDot,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
  },
  {
    value: "lizard",
    label: "Lizards",
    faIcon: faSpider,
    lucideIcon: Activity,
    color: "text-lime-500",
    bgColor: "bg-lime-100 dark:bg-lime-900/20",
  },
  {
    value: "guinea-pig",
    label: "Guinea Pigs",
    faIcon: faPaw,
    lucideIcon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-100 dark:bg-rose-900/20",
  },
  {
    value: "ferret",
    label: "Ferrets",
    faIcon: faShieldDog,
    lucideIcon: CircleDot,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
  },
  {
    value: "chinchilla",
    label: "Chinchillas",
    faIcon: faPaw,
    lucideIcon: Sparkles,
    color: "text-violet-500",
    bgColor: "bg-violet-100 dark:bg-violet-900/20",
  },
  {
    value: "hedgehog",
    label: "Hedgehogs",
    faIcon: faSpider,
    lucideIcon: CircleDot,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    value: "gerbil",
    label: "Gerbils",
    faIcon: faGerbil,
    lucideIcon: CircleDot,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/20",
  },
  {
    value: "mouse",
    label: "Mice",
    faIcon: faMouse,
    lucideIcon: CircleDot,
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-900/20",
  },
  {
    value: "rat",
    label: "Rats",
    faIcon: faRat,
    lucideIcon: CircleDot,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-900/20",
  },
]

// Helper function to get animal config by value
export function getAnimalConfig(value: string): AnimalTypeConfig | undefined {
  return ANIMAL_TYPES.find((animal) => animal.value === value)
}

// Helper function to get animal config map (for quick lookups)
export function getAnimalConfigMap(): Record<string, AnimalTypeConfig> {
  return ANIMAL_TYPES.reduce((acc, animal) => {
    acc[animal.value] = animal
    return acc
  }, {} as Record<string, AnimalTypeConfig>)
}

// Export animal options in FontAwesome format (for backward compatibility)
export function getAnimalOptionsFA() {
  return ANIMAL_TYPES.map((animal) => ({
    value: animal.value,
    label: animal.label,
    icon: animal.faIcon,
    color: animal.color,
    bgColor: animal.bgColor,
  }))
}

// Export animal config for Lucide React usage
export function getAnimalConfigLucide(value: string): {
  icon: LucideIcon
  color: string
  label: string
} | undefined {
  const config = getAnimalConfig(value)
  if (!config) return undefined
  return {
    icon: config.lucideIcon,
    color: config.color,
    label: config.label,
  }
}

