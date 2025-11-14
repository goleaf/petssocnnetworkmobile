/**
 * Script to move all test files from __tests__ folders to centralized locations
 * - E2E tests (Playwright) → e2e/ folder (already done)
 * - Unit tests → tests/unit/ folder
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();

interface TestFile {
  sourcePath: string;
  targetPath: string;
  type: 'unit' | 'e2e';
  category: 'app' | 'components' | 'lib' | 'api';
}

function findTestFiles(): TestFile[] {
  const testFiles: TestFile[] = [];
  
  function walkDir(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (['node_modules', '.next', '.git', 'dist', 'build', 'test-results', 'playwright-report'].includes(entry.name)) {
          continue;
        }
        
        // If it's a __tests__ folder, process its files
        if (entry.name === '__tests__') {
          const testEntries = fs.readdirSync(fullPath, { withFileTypes: true });
          for (const testEntry of testEntries) {
            if (testEntry.isFile() && (testEntry.name.endsWith('.test.ts') || testEntry.name.endsWith('.test.tsx') || testEntry.name.endsWith('.spec.ts'))) {
              const testFilePath = path.join(fullPath, testEntry.name);
              
              // Determine category and target path
              let category: 'app' | 'components' | 'lib' | 'api' = 'lib';
              let targetPath = '';
              
              if (relPath.includes('app/') || relPath.includes('app\\')) {
                category = 'app';
                // Extract the path after app/
                const appPath = relPath.split(/app[\/\\]/)[1] || '';
                targetPath = path.join(ROOT_DIR, 'tests', 'unit', 'app', appPath.replace('__tests__/', ''), testEntry.name);
              } else if (relPath.includes('components/') || relPath.includes('components\\')) {
                category = 'components';
                const compPath = relPath.split(/components[\/\\]/)[1] || '';
                targetPath = path.join(ROOT_DIR, 'tests', 'unit', 'components', compPath.replace('__tests__/', ''), testEntry.name);
              } else if (relPath.includes('api/') || relPath.includes('api\\')) {
                category = 'api';
                const apiPath = relPath.split(/api[\/\\]/)[1] || '';
                targetPath = path.join(ROOT_DIR, 'tests', 'unit', 'api', apiPath.replace('__tests__/', ''), testEntry.name);
              } else {
                // lib or root __tests__
                const libPath = relPath.includes('lib/') || relPath.includes('lib\\') 
                  ? relPath.split(/lib[\/\\]/)[1] || ''
                  : relPath.replace('__tests__/', '');
                targetPath = path.join(ROOT_DIR, 'tests', 'unit', 'lib', libPath.replace('__tests__/', ''), testEntry.name);
              }
              
              // Ensure target directory exists
              const targetDir = path.dirname(targetPath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              
              testFiles.push({
                sourcePath: testFilePath,
                targetPath,
                type: 'unit',
                category
              });
            }
          }
        } else {
          walkDir(fullPath, relPath);
        }
      }
    }
  }
  
  walkDir(ROOT_DIR);
  return testFiles;
}

function moveTests() {
  const testFiles = findTestFiles();
  const moved: string[] = [];
  const skipped: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];
  
  console.log(`Found ${testFiles.length} test files to move\n`);
  
  for (const testFile of testFiles) {
    try {
      // Check if target already exists
      if (fs.existsSync(testFile.targetPath)) {
        console.log(`Skipping ${testFile.sourcePath} - target already exists: ${testFile.targetPath}`);
        skipped.push(testFile.sourcePath);
        continue;
      }
      
      // Create target directory if needed
      const targetDir = path.dirname(testFile.targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Read source file content
      let content = fs.readFileSync(testFile.sourcePath, 'utf-8');
      
      // Fix import paths - this is a simplified version, may need manual fixes
      // Replace relative imports that might break
      content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\//g, "from '@/");
      content = content.replace(/from ['"]\.\.\/\.\.\//g, "from '@/");
      content = content.replace(/from ['"]\.\.\//g, (match, p1) => {
        // Try to determine the correct import path
        return match;
      });
      
      // Write to target
      fs.writeFileSync(testFile.targetPath, content, 'utf-8');
      
      // Delete source (or comment out for safety)
      // fs.unlinkSync(testFile.sourcePath);
      
      console.log(`Moved: ${testFile.sourcePath} → ${testFile.targetPath}`);
      moved.push(testFile.sourcePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error moving ${testFile.sourcePath}: ${errorMsg}`);
      errors.push({ file: testFile.sourcePath, error: errorMsg });
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Moved: ${moved.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n=== Errors ===`);
    errors.forEach(({ file, error }) => {
      console.log(`${file}: ${error}`);
    });
  }
  
  // Delete empty __tests__ folders (commented out for safety)
  console.log(`\nNote: Empty __tests__ folders were not deleted. Please review and delete manually.`);
}

if (require.main === module) {
  moveTests();
}

export { moveTests, findTestFiles };





