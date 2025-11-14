# Email Change Functionality Implementation Notes

## Completed Tasks (Task 3)

### 3.1 Server Action - `requestEmailChangeAction`
**File:** `lib/actions/account.ts`

**Implementation:**
- Updated to use Prisma ORM instead of in-memory storage
- Validates current user authentication
- Verifies current password (using plain text comparison as per existing codebase pattern)
- Validates new email format using existing `validateEmailAddress` utility
- Checks for email uniqueness in database
- Generates cryptographically secure 32-byte token using `crypto.randomBytes`
- Creates `EmailVerification` record with 24-hour expiration
- Deletes any existing verification records for the user before creating new one
- Logs verification and cancellation links to console (simulating email sending)
- Returns success with expiration timestamp

**Note:** Password verification currently uses plain text comparison. In production, this should be updated to use bcrypt when the codebase migrates to proper password hashing.

### 3.2 Email Verification Endpoint
**File:** `app/api/verify-email/route.ts`

**Implementation:**
- GET endpoint that accepts token as query parameter
- Validates token exists and is not expired
- Fetches verification record with user relation from database
- Updates user email and sets `emailVerified` to true
- Deletes verification record after successful verification
- Logs confirmation messages (simulating email sending to both old and new addresses)
- Returns appropriate error responses for missing, invalid, or expired tokens
- Handles database errors gracefully

### 3.3 Email Change Cancellation Endpoint
**File:** `app/api/cancel-email-change/route.ts`

**Implementation:**
- GET endpoint that accepts token as query parameter
- Validates token exists
- Fetches verification record with user relation
- Deletes verification record to cancel the email change
- Logs cancellation confirmation (simulating email to original address)
- Returns appropriate error responses for missing or invalid tokens
- Handles database errors gracefully

### 3.4 Email Change Dialog Component
**File:** `components/settings/email-change-dialog.tsx`

**Implementation:**
- Client component with controlled form state
- New email input with real-time format validation using regex
- Current password input with show/hide toggle
- Checkbox to control whether verification email is sent
- Form validation before submission
- Loading state during submission with disabled inputs
- Error display for validation and submission errors
- Success handling with form reset
- Proper accessibility with labels and ARIA attributes
- Responsive design using Tailwind CSS
- Uses existing UI components (Dialog, Input, Button, Checkbox, etc.)

## Database Schema

The implementation uses the following Prisma models (already created in migration):

```prisma
model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  emailVerified         Boolean   @default(false)
  passwordHash          String
  emailVerifications    EmailVerification[]
  // ... other fields
}

model EmailVerification {
  id            String    @id @default(uuid())
  userId        String
  pendingEmail  String
  token         String    @unique
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

## Integration Points

### To integrate the email change dialog into the settings page:

1. Import the component:
```typescript
import { EmailChangeDialog } from "@/components/settings/email-change-dialog"
```

2. Add state for dialog visibility (already exists in settings page):
```typescript
const [emailDialogOpen, setEmailDialogOpen] = useState(false)
```

3. Create handler function:
```typescript
const handleEmailChange = async (data: { newEmail: string; currentPassword: string; sendVerification: boolean }) => {
  const result = await requestEmailChangeAction({
    userId: user.id,
    ...data
  })
  
  if (!result.success) {
    throw new Error(result.error || "Failed to change email")
  }
  
  setEmailDialogOpen(false)
  // Show success message
  setMessage({ type: "success", text: `Verification sent to ${data.newEmail}` })
  await refresh() // Refresh user data
}
```

4. Add the dialog component:
```tsx
<EmailChangeDialog
  open={emailDialogOpen}
  onOpenChange={setEmailDialogOpen}
  onSubmit={handleEmailChange}
  isSubmitting={emailSubmitting}
/>
```

## Security Considerations

1. **Token Security:**
   - Uses `crypto.randomBytes(32)` for cryptographically secure tokens
   - Tokens are 64 characters (32 bytes hex-encoded)
   - 24-hour expiration enforced at database level

2. **Password Verification:**
   - Currently uses plain text comparison (prototype)
   - Should be updated to bcrypt when codebase migrates to proper hashing

3. **Email Validation:**
   - Uses existing `validateEmailAddress` utility
   - Checks for email uniqueness before creating verification record

4. **Authorization:**
   - Verifies current user matches userId in request
   - Uses `getCurrentUser()` from auth-server

5. **Database Security:**
   - Uses Prisma ORM with parameterized queries (SQL injection protection)
   - Cascade delete on user deletion removes verification records
   - Unique constraint on token prevents duplicates

## Testing Recommendations

1. **Unit Tests:**
   - Test email format validation
   - Test password validation
   - Test token generation uniqueness
   - Test expiration logic

2. **Integration Tests:**
   - Test complete email change flow
   - Test verification with valid token
   - Test verification with expired token
   - Test cancellation flow
   - Test error handling for duplicate emails

3. **E2E Tests:**
   - Test dialog interaction
   - Test form validation
   - Test success/error messages
   - Test email verification page flow

## Future Enhancements

1. **Email Service Integration:**
   - Replace console.log with actual email sending service
   - Use templates for verification and notification emails
   - Add email delivery tracking

2. **Rate Limiting:**
   - Add rate limiting to prevent abuse (max 3 requests per hour as per requirements)
   - Track failed attempts

3. **Password Hashing:**
   - Migrate to bcrypt for password verification
   - Update all password-related operations

4. **Audit Logging:**
   - Log all email change requests
   - Track verification attempts
   - Monitor for suspicious activity

5. **User Experience:**
   - Add email preview before sending
   - Show countdown timer for token expiration
   - Add resend verification option
   - Improve error messages with specific guidance
