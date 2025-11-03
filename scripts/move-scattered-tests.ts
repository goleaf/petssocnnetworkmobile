import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to move all scattered test files from __tests__ folders to centralized locations
 * - E2E tests: e2e/ folder (already centralized, skip)
 * - Unit tests: tests/unit/ folder structure
 */

interface TestFile {
  sourcePath: string;
  destPath: string;
  type: 'unit' | 'e2e';
}

const rootDir = path.resolve(__dirname, '..');

function findTestFiles(dir: string, files: TestFile[] = []): TestFile[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .git, etc.
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist') {
      continue;
    }

    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        // Found a __tests__ directory
        const testFiles = fs.readdirSync(fullPath);
        for (const testFile of testFiles) {
          if (testFile.endsWith('.test.ts') || testFile.endsWith('.test.tsx') || testFile.endsWith('.spec.ts') || testFile.endsWith('.spec.tsx')) {
            const sourcePath = path.join(fullPath, testFile);
            const relativePath = path.relative(rootDir, sourcePath);
            
            // Determine destination based on source location
            let destPath: string;
            if (relativePath.includes('app/api')) {
              // API route tests -> tests/unit/api/
              const apiPath = relativePath.split('app/api/')[1];
              destPath = path.join(rootDir, 'tests', 'unit', 'api', apiPath);
            } else if (relativePath.includes('app/admin') || relativePath.includes('app/[locale]')) {
              // App/page tests -> tests/unit/app/
              const appPath = relativePath.split('app/')[1];
              destPath = path.join(rootDir, 'tests', 'unit', 'app', appPath);
            } else if (relativePath.includes('components')) {
              // Component tests -> tests/unit/components/
              const compPath = relativePath.split('components/')[1];
              destPath = path.join(rootDir, 'tests', 'unit', 'components', compPath);
            } else if (relativePath.includes('lib')) {
              // Library tests -> tests/unit/lib/
              const libPath = relativePath.split('lib/')[1];
              destPath = path.join(rootDir, 'tests', 'unit', 'lib', libPath);
            } else {
              // Root __tests__ -> tests/unit/
              destPath = path.join(rootDir, 'tests', 'unit', testFile);
            }

            files.push({
              sourcePath,
              destPath,
              type: 'unit',
            });
          }
        }
      } else {
        // Recurse into subdirectories
        findTestFiles(fullPath, files);
      }
    }
  }

  return files;
}

function moveTestFile(testFile: TestFile): void {
  try {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(testFile.destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Check if destination already exists
    if (fs.existsSync(testFile.destPath)) {
      console.log(`⚠️  Destination already exists, skipping: ${testFile.destPath}`);
      // Still delete source if it's a duplicate
      if (fs.readFileSync(testFile.sourcePath).toString() === fs.readFileSync(testFile.destPath).toString()) {
        fs.unlinkSync(testFile.sourcePath);
        // Try to remove empty __tests__ directory
        const testsDir = path.dirname(testFile.sourcePath);
        try {
          if (fs.readdirSync(testsDir).length === 0) {
            fs.rmdirSync(testsDir);
          }
        } catch (e) {
          // Ignore if directory not empty or other error
        }
      }
      return;
    }

    // Move the file
    fs.copyFileSync(testFile.sourcePath, testFile.destPath);
    fs.unlinkSync(testFile.sourcePath);
    console.log(`✅ Moved: ${path.relative(rootDir, testFile.sourcePath)} -> ${path.relative(rootDir, testFile.destPath)}`);

    // Try to remove empty __tests__ directory
    const testsDir = path.dirname(testFile.sourcePath);
    try {
      if (fs.readdirSync(testsDir).length === 0) {
        fs.rmdirSync(testsDir);
        console.log(`🗑️  Removed empty directory: ${path.relative(rootDir, testsDir)}`);
      }
    } catch (e) {
      // Ignore if directory not empty or other error
    }
  } catch (error) {
    console.error(`❌ Error moving ${testFile.sourcePath}:`, error);
  }
}

function main() {
  console.log('🔍 Finding all scattered test files...');
  const testFiles = findTestFiles(rootDir);
  
  console.log(`\n📊 Found ${testFiles.length} test files to move\n`);
  
  for (const testFile of testFiles) {
    moveTestFile(testFile);
  }
  
  console.log(`\n✅ Completed moving ${testFiles.length} test files`);
}

main();




