# Breed Infobox Schema and Form Usage

## Overview

This document describes how to use the Zod schema for Breed infobox and the UI form component.

## Files Created

1. **lib/schemas/breed-infobox.ts** - Zod schema with all required fields and validation
2. **components/wiki/breed-infobox-form.tsx** - React form component with validation UI
3. **lib/schemas/__tests__/breed-infobox.test.ts** - Comprehensive test suite

## Schema Fields

### Required Fields
- `species`: One of: "dog", "cat", "bird", "rabbit", "hamster", "fish", "other"
- `officialName`: String 2-100 characters

### Optional Fields
- `aliases[]`: Array of strings (1-50 chars each)
- `originCountry`: String 2-100 characters
- `sizeClass`: One of: "toy", "small", "medium", "large", "giant"
- `maleAvgWeightKg`: Positive number ≤ 100kg
- `femaleAvgWeightKg`: Positive number ≤ 100kg
- `lifeExpectancyYears`: Positive number ≤ 50 years
- `coatType`: String 2-50 characters
- `colorVariants[]`: Array of strings (1-50 chars each)
- `activityNeeds`: Integer 1-5
- `trainability`: Integer 1-5
- `shedding`: One of: "none", "low", "moderate", "high"
- `groomingFrequency`: One of: "daily", "weekly", "bi-weekly", "monthly"
- `temperamentTags[]`: Array of strings (1-50 chars each)
- `commonHealthRisks[]`: Array of strings (2-100 chars each)
- `careLevel`: One of: "beginner", "intermediate", "advanced", "expert"
- `images[]`: Array of valid URLs

### Computed Fields
The schema automatically generates `computedTags` based on the input data:
- `high-shedding` - when shedding is "high"
- `hypoallergenic-potential` - when shedding is "none"
- `high-energy` - when activityNeeds ≥ 4
- `low-energy` - when activityNeeds ≤ 2
- `{sizeClass}-sized` - based on size class
- `experienced-owner-recommended` - when careLevel is "advanced" or "expert"
- `high-maintenance-grooming` - when groomingFrequency is "daily"
- `low-maintenance-grooming` - when groomingFrequency is "monthly"

## Usage Examples

### Basic Usage

```typescript
import { validateBreedInfobox, parseBreedInfobox } from "@/lib/schemas/breed-infobox"

// Simple validation (throws on error)
const breedData = {
  species: "dog",
  officialName: "Golden Retriever",
  shedding: "moderate",
  activityNeeds: 4
}

const validated = validateBreedInfobox(breedData)
console.log(validated.computedTags) // ["high-energy"]

// Safe validation (returns result object)
const result = parseBreedInfobox(breedData)
if (result.success) {
  console.log(result.data.computedTags)
} else {
  console.error(result.error.issues)
}
```

### Using the Form Component

```tsx
import { BreedInfoboxForm } from "@/components/wiki/breed-infobox-form"

function MyBreedPage() {
  const [breedData, setBreedData] = useState(null)
  
  return (
    <BreedInfoboxForm
      initialData={breedData}
      onChange={(data) => {
        setBreedData(data)
        // Optionally validate
        const result = parseBreedInfobox(data)
        if (!result.success) {
          console.error("Validation errors:", result.error.issues)
        }
      }}
    />
  )
}
```

### Integration with Wiki Articles

The schema is designed to be stored in the `infoboxJSON` field of wiki revision data:

```typescript
import { validateBreedInfobox } from "@/lib/schemas/breed-infobox"

const wikiRevision = {
  contentJSON: { /* article content */ },
  infoboxJSON: validateBreedInfobox({
    species: "dog",
    officialName: "Golden Retriever",
    // ... other fields
  })
}
```

## Validation Rules

1. **Cross-field validation**: If both maleAvgWeightKg and femaleAvgWeightKg are provided, they must differ by at least 0.5kg
2. **URL validation**: All image URLs must be valid
3. **Array item validation**: All items in arrays have length constraints
4. **Enum validation**: All enum fields must match exact values

## Tests

Run tests with:
```bash
pnpm test lib/schemas/__tests__/breed-infobox.test.ts
```

All 37 tests pass, covering:
- ✅ Valid data acceptance
- ✅ Invalid value rejection  
- ✅ Computed tag generation
- ✅ Cross-field validation
- ✅ Edge cases
- ✅ Helper functions

