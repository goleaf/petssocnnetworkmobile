"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateToSQLite, verifyMigration, type MigrationResult } from '@/lib/storage/migrate-to-sqlite';
import { validateStorage, type ValidationResult } from '@/lib/storage/validate';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function MigrateStorageComponent() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; differences: unknown[] } | null>(null);
  const [dbPath, setDbPath] = useState('./data/pet-social.db');

  const handleValidate = () => {
    setIsValidating(true);
    try {
      const result = validateStorage();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    setVerificationResult(null);

    try {
      const result = await migrateToSQLite({
        dbPath,
        validateBeforeMigration: true,
        backupLocalStorage: true,
        verbose: true,
      });

      setMigrationResult(result);

      if (result.success) {
        // Verify migration
        const verification = verifyMigration(dbPath);
        setVerificationResult(verification);
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        migratedKeys: [],
        skippedKeys: [],
        errors: [{ key: 'migration', error: error instanceof Error ? error.message : String(error) }],
        stats: {
          totalKeys: 0,
          migratedCount: 0,
          skippedCount: 0,
          errorCount: 1,
        },
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Storage Migration to SQLite</CardTitle>
          <CardDescription>
            Migrate your localStorage data to SQLite database for better performance and reliability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Database Path Input */}
          <div className="space-y-2">
            <label htmlFor="db-path" className="text-sm font-medium">
              Database Path
            </label>
            <input
              id="db-path"
              type="text"
              value={dbPath}
              onChange={(e) => setDbPath(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="./data/pet-social.db"
            />
            <p className="text-xs text-muted-foreground">
              Path where the SQLite database will be created
            </p>
          </div>

          {/* Validation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Step 1: Validate Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Check data integrity before migration
                </p>
              </div>
              <Button onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Storage'
                )}
              </Button>
            </div>

            {validationResult && (
              <Alert className={validationResult.isValid ? '' : 'border-destructive'}>
                {validationResult.isValid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {validationResult.isValid ? 'Validation Passed' : 'Validation Failed'}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    <p>Total Keys: {validationResult.stats.totalKeys}</p>
                    <p>Valid Keys: {validationResult.stats.validKeys}</p>
                    <p>Invalid Keys: {validationResult.stats.invalidKeys}</p>
                    {validationResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside text-sm">
                          {validationResult.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>{error.key}: {error.message}</li>
                          ))}
                          {validationResult.errors.length > 5 && (
                            <li>... and {validationResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Migration Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Step 2: Migrate to SQLite</h3>
                <p className="text-sm text-muted-foreground">
                  Convert localStorage data to SQLite database
                </p>
              </div>
              <Button 
                onClick={handleMigrate} 
                disabled={isMigrating || !validationResult?.isValid}
                variant="default"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Start Migration'
                )}
              </Button>
            </div>

            {migrationResult && (
              <Alert className={migrationResult.success ? '' : 'border-destructive'}>
                {migrationResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {migrationResult.success ? 'Migration Completed' : 'Migration Failed'}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    <p>Migrated: {migrationResult.stats.migratedCount}</p>
                    <p>Skipped: {migrationResult.stats.skippedCount}</p>
                    <p>Errors: {migrationResult.stats.errorCount}</p>
                    {migrationResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside text-sm">
                          {migrationResult.errors.map((error, i) => (
                            <li key={i}>{error.key}: {error.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {verificationResult && (
              <Alert className={verificationResult.verified ? '' : 'border-yellow-500'}>
                {verificationResult.verified ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {verificationResult.verified ? 'Verification Passed' : 'Verification Found Differences'}
                </AlertTitle>
                <AlertDescription>
                  {verificationResult.verified ? (
                    'All data matches between localStorage and SQLite'
                  ) : (
                    `Found ${verificationResult.differences.length} differences between localStorage and SQLite`
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

