/**
 * Authentication utilities for SSO, OAuth, and 2FA
 */

import { hash, verifyHash } from './encryption';

/**
 * SSO Configuration
 */
export interface SSOConfig {
  /** Social platform SSO endpoint */
  ssoEndpoint: string;
  /** Client ID for SSO */
  clientId: string;
  /** Client secret for SSO */
  clientSecret: string;
  /** Redirect URI after SSO */
  redirectUri: string;
}

/**
 * OAuth Configuration for Partners
 */
export interface OAuthConfig {
  /** OAuth provider name */
  provider: string;
  /** Authorization endpoint */
  authEndpoint: string;
  /** Token endpoint */
  tokenEndpoint: string;
  /** Client ID */
  clientId: string;
  /** Client secret */
  clientSecret: string;
  /** Scopes */
  scopes: string[];
  /** Redirect URI */
  redirectUri: string;
}

/**
 * 2FA Configuration
 */
export interface TwoFactorConfig {
  /** Whether 2FA is enabled for the user */
  enabled: boolean;
  /** Secret key for TOTP */
  secret?: string;
  /** Backup codes */
  backupCodes?: string[];
}

/**
 * Get SSO configuration from environment
 */
export function getSSOConfig(): SSOConfig | null {
  const endpoint = process.env.SSO_ENDPOINT;
  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;
  const redirectUri = process.env.SSO_REDIRECT_URI;

  if (!endpoint || !clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    ssoEndpoint: endpoint,
    clientId,
    clientSecret,
    redirectUri,
  };
}

/**
 * Generate SSO login URL
 */
export function generateSSOLoginUrl(state?: string): string | null {
  const config = getSSOConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
  });

  if (state) {
    params.set('state', state);
  }

  return `${config.ssoEndpoint}?${params.toString()}`;
}

/**
 * Exchange SSO code for token
 */
export async function exchangeSSOCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: {
    id: string;
    email: string;
    name: string;
  };
} | null> {
  const config = getSSOConfig();
  if (!config) return null;

  try {
    const response = await fetch(config.ssoEndpoint.replace('/authorize', '/token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`SSO token exchange failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format")
    }

    const data = await response.json();

    // Fetch user info
    const userInfoResponse = await fetch(`${config.ssoEndpoint.replace('/authorize', '/userinfo')}`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
    }

    const userInfoContentType = userInfoResponse.headers.get("content-type")
    if (!userInfoContentType || !userInfoContentType.includes("application/json")) {
      throw new Error("Invalid user info response format")
    }

    const userInfo = await userInfoResponse.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      userInfo: {
        id: userInfo.sub || userInfo.id,
        email: userInfo.email,
        name: userInfo.name || userInfo.preferred_username,
      },
    };
  } catch (error) {
    console.error('SSO code exchange failed:', error);
    return null;
  }
}

/**
 * Generate OAuth authorization URL for partner
 */
export function generateOAuthUrl(config: OAuthConfig, state?: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
  });

  if (state) {
    params.set('state', state);
  }

  return `${config.authEndpoint}?${params.toString()}`;
}

/**
 * Exchange OAuth code for token
 */
export async function exchangeOAuthCode(
  code: string,
  config: OAuthConfig
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
} | null> {
  try {
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format")
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('OAuth code exchange failed:', error);
    return null;
  }
}

/**
 * Generate TOTP secret for 2FA
 */
export function generate2FASecret(): string {
  // In production, use a proper TOTP library like 'otplib'
  // This is a simplified version
  const secret = require('crypto').randomBytes(20).toString('base32');
  return secret;
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify 2FA code
 * In production, use a proper TOTP library
 */
export function verify2FACode(secret: string, code: string): boolean {
  // This is a placeholder - implement proper TOTP verification
  // Use a library like 'otplib' for production
  console.warn('2FA verification not fully implemented - use otplib for production');
  return false;
}

/**
 * Enable 2FA for a user
 */
export function enable2FA(userId: string): TwoFactorConfig {
  const secret = generate2FASecret();
  const backupCodes = generateBackupCodes();

  // Store secret and backup codes (encrypted) in database
  // This is a simplified version - implement proper storage

  return {
    enabled: true,
    secret,
    backupCodes,
  };
}

/**
 * Verify 2FA with code or backup code
 */
export function verify2FA(
  config: TwoFactorConfig,
  code: string
): { valid: boolean; usedBackupCode?: boolean } {
  if (!config.enabled || !config.secret) {
    return { valid: false };
  }

  // Check if it's a backup code
  if (config.backupCodes?.includes(code)) {
    // Remove used backup code
    const updatedCodes = config.backupCodes.filter((c) => c !== code);
    return { valid: true, usedBackupCode: true };
  }

  // Verify TOTP code
  const valid = verify2FACode(config.secret, code);
  return { valid };
}

