# Pet Profile Components

This directory contains components for the Pet Profile System feature.

## Pet Creation Wizard

The `PetCreationWizard` component is a multi-step modal dialog that guides users through creating a comprehensive pet profile.

### Features

- **6-Step Process**: Organized workflow covering all aspects of pet information
- **Progress Tracking**: Visual progress bar and step indicator with checkmarks
- **Form Validation**: Real-time validation with error messages
- **Draft Saving**: Auto-saves every 30 seconds to localStorage
- **Draft Restoration**: Automatically restores unsaved work when reopening
- **Navigation**: Back/Next buttons with step validation
- **Close Confirmation**: Warns users about unsaved changes
- **Error Summary**: Displays all validation errors at the top of the form

### Usage

```tsx
import { PetCreationWizard } from "@/components/pet/pet-creation-wizard"

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Add New Pet
      </Button>
      
      <PetCreationWizard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userId={user.id}
      />
    </>
  )
}
```

### Steps

1. **Basic Information** (`step1-basic-info.tsx`)
   - Pet name, species, breed
   - Gender, spayed/neutered status
   - Color, markings, weight
   - Birthday or approximate age
   - Adoption date

2. **Photos & Gallery** (`step2-photos.tsx`)
   - Primary photo upload with cropping
   - Multi-photo upload (up to 20)
   - Drag-and-drop reordering
   - Photo captions and editing
   - Filters and adjustments

3. **Personality & Temperament** (`step3-personality.tsx`)
   - Personality trait selection (up to 10)
   - Custom traits
   - Favorite activities, treats, toys
   - Dislikes and special needs

4. **Identification** (`step4-identification.tsx`)
   - Microchip ID and company
   - Registration status
   - Certificate upload
   - Collar tag ID
   - Insurance policy number

5. **Medical Information** (`step5-medical.tsx`)
   - Vet clinic details
   - Allergies with severity levels
   - Current medications
   - Pre-existing conditions

6. **Bio & Review** (`step6-bio-review.tsx`)
   - Rich text bio editor (1000 chars)
   - Privacy settings
   - Featured pet checkbox
   - Review summary of all information
   - Final submission

### Data Flow

1. User fills out each step
2. Data is stored in component state
3. Auto-saved to localStorage every 30 seconds
4. On submission, data is validated against Zod schema
5. POST request to `/api/pets/create`
6. On success, redirects to new pet profile page

### Draft Management

Drafts are automatically saved to localStorage with the key `pet-creation-draft`. The draft includes:
- All form data from all steps
- Completed steps tracking
- Timestamp of last save

Drafts are automatically restored when the wizard is reopened and cleared upon successful submission.

### Validation

Each step has its own validation rules:
- Step 1: Name (2-50 chars) and species are required
- Step 2: Photos are optional but validated for format/size
- Step 3: All fields optional
- Step 4: Microchip ID must be 15 digits if provided
- Step 5: All fields optional
- Step 6: Bio limited to 1000 characters

Final submission validates the complete form against the `createPetSchema` from `@/lib/schemas/pet-schema`.

### Error Handling

- Inline validation errors appear below fields
- Error summary displays at top of form
- Failed uploads show retry options
- Network errors display user-friendly messages
- Draft recovery after errors

### Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management in modal
- Screen reader announcements
- Color contrast meets WCAG AA standards

## Known Issues

- TypeScript error with `useRouter()` in Next.js 16 - this is a type definition issue and doesn't affect runtime behavior
