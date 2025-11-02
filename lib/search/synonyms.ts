/**
 * Synonym dictionary for search query expansion
 * Maps abbreviations and alternate terms to canonical forms
 */

import type { SynonymEntry, SearchCategory } from "@/lib/types/search"

// Synonym dictionary - can be extended via API or admin panel
const SYNONYM_DICTIONARY: SynonymEntry[] = [
  // Breed synonyms
  {
    terms: ["GSD", "German Shepherd", "German Shepherd Dog", "Alsatian"],
    primary: "German Shepherd",
    category: "breed",
  },
  {
    terms: ["Lab", "Labrador", "Labrador Retriever"],
    primary: "Labrador Retriever",
    category: "breed",
  },
  {
    terms: ["Golden", "Golden Retriever"],
    primary: "Golden Retriever",
    category: "breed",
  },
  {
    terms: ["Dachshund", "Wiener Dog", "Sausage Dog"],
    primary: "Dachshund",
    category: "breed",
  },
  {
    terms: ["Pit Bull", "Pitbull", "American Pit Bull Terrier", "APBT"],
    primary: "American Pit Bull Terrier",
    category: "breed",
  },
  {
    terms: ["Poodle", "Standard Poodle", "Miniature Poodle", "Toy Poodle"],
    primary: "Poodle",
    category: "breed",
  },
  {
    terms: ["Beagle"],
    primary: "Beagle",
    category: "breed",
  },
  {
    terms: ["Rottweiler", "Rottie"],
    primary: "Rottweiler",
    category: "breed",
  },
  {
    terms: ["Yorkshire Terrier", "Yorkie"],
    primary: "Yorkshire Terrier",
    category: "breed",
  },
  {
    terms: ["Bulldog", "English Bulldog"],
    primary: "Bulldog",
    category: "breed",
  },
  // Health synonyms
  {
    terms: ["kennel cough", "infectious tracheobronchitis", "bordetella"],
    primary: "Kennel Cough",
    category: "health",
  },
  {
    terms: ["parvo", "parvovirus", "CPV"],
    primary: "Parvovirus",
    category: "health",
  },
  {
    terms: ["distemper", "canine distemper"],
    primary: "Canine Distemper",
    category: "health",
  },
  {
    terms: ["hip dysplasia", "HD"],
    primary: "Hip Dysplasia",
    category: "health",
  },
  // General terms
  {
    terms: ["vet", "veterinarian", "veterinary", "animal doctor"],
    primary: "Veterinarian",
  },
  {
    terms: ["dog park", "canine park", "pet park"],
    primary: "Dog Park",
    category: "place",
  },
  {
    terms: ["groomer", "pet groomer", "dog groomer"],
    primary: "Pet Groomer",
    category: "place",
  },
]

/**
 * Expand a search query using synonym dictionary
 */
export function expandQueryWithSynonyms(
  query: string,
  category?: SearchCategory
): string[] {
  const queryLower = query.toLowerCase().trim()
  const expandedTerms = new Set<string>([query]) // Include original query

  for (const entry of SYNONYM_DICTIONARY) {
    // Skip if category doesn't match (when category is specified)
    if (category && entry.category && entry.category !== category) {
      continue
    }

    // Check if any term in the entry matches the query
    const matchesEntry = entry.terms.some(
      (term) => term.toLowerCase() === queryLower
    )

    if (matchesEntry) {
      // Add all terms from the entry
      entry.terms.forEach((term) => expandedTerms.add(term))
      expandedTerms.add(entry.primary)
    }

    // Also check if query contains any of the terms
    const containsTerm = entry.terms.some((term) =>
      queryLower.includes(term.toLowerCase())
    )

    if (containsTerm) {
      // Add primary term
      expandedTerms.add(entry.primary)
    }
  }

  return Array.from(expandedTerms)
}

/**
 * Get canonical form of a term
 */
export function getCanonicalTerm(
  term: string,
  category?: SearchCategory
): string {
  const termLower = term.toLowerCase().trim()

  for (const entry of SYNONYM_DICTIONARY) {
    if (category && entry.category && entry.category !== category) {
      continue
    }

    if (entry.terms.some((t) => t.toLowerCase() === termLower)) {
      return entry.primary
    }
  }

  return term // Return original if no synonym found
}

/**
 * Find all synonyms for a given term
 */
export function findSynonyms(
  term: string,
  category?: SearchCategory
): string[] {
  const termLower = term.toLowerCase().trim()
  const synonyms = new Set<string>()

  for (const entry of SYNONYM_DICTIONARY) {
    if (category && entry.category && entry.category !== category) {
      continue
    }

    const matchesEntry = entry.terms.some(
      (t) => t.toLowerCase() === termLower
    )

    if (matchesEntry) {
      entry.terms.forEach((t) => {
        if (t.toLowerCase() !== termLower) {
          synonyms.add(t)
        }
      })
    }
  }

  return Array.from(synonyms)
}

/**
 * Add a new synonym entry (for admin use)
 */
export function addSynonym(entry: SynonymEntry): void {
  // In a real app, this would persist to a database
  // For now, we'll add to the in-memory dictionary
  SYNONYM_DICTIONARY.push(entry)
}

/**
 * Get all synonym entries
 */
export function getAllSynonyms(category?: SearchCategory): SynonymEntry[] {
  if (!category) {
    return SYNONYM_DICTIONARY
  }

  return SYNONYM_DICTIONARY.filter(
    (entry) => !entry.category || entry.category === category
  )
}

