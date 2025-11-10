/**
 * Test file to verify PetCreationWizard can be imported and used
 * This file can be deleted after verification
 */

"use client"

import { useState } from "react"
import { PetCreationWizard } from "./pet-creation-wizard"
import { AddPetButton } from "./add-pet-button"

export function WizardTest() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Pet Creation Wizard Test</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Using AddPetButton:</h2>
        <AddPetButton />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Using PetCreationWizard directly:</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Open Wizard
        </button>
        
        <PetCreationWizard
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          userId="test-user-id"
        />
      </div>
    </div>
  )
}
