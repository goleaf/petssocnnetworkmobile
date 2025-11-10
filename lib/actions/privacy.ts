'use server'

import { getCurrentUser } from '@/lib/auth-server'
import {
  updatePrivacySettings as updatePrivacySettingsService,
  getPrivacySettings as getPrivacySettingsService
} from '@/lib/services/privacy'
import type { PrivacySettings } from '@/lib/types/settings'

export async function updatePrivacySettingsAction(settings: Partial<PrivacySettings>) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    await updatePrivacySettingsService(user.id, settings)
    
    return { success: true }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return { success: false, error: 'Failed to update privacy settings' }
  }
}

export async function getPrivacySettingsAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', settings: null }
    }
    
    const settings = await getPrivacySettingsService(user.id)
    
    return { success: true, settings }
  } catch (error) {
    console.error('Error getting privacy settings:', error)
    return { success: false, error: 'Failed to get privacy settings', settings: null }
  }
}
