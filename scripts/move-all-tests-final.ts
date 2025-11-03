/**
 * Final script to move ALL remaining tests from __tests__ folders to tests/unit/
 */

import { readdirSync, mkdirSync, copyFileSync, existsSync, statSync } from 'fs';
import { join, dirname, relative, sep } from 'path';

const rootDir = process.cwd();
const targetBase = join(rootDir, 'tests', 'unit');

function shouldIgnorePath(path: string): boolean {
  // Ignore node_modules, .next, test-results, etc.
  return path.includes('node_modules') || 
         path.includes('.next') || 
         path.includes('test-results') ||
         path.includes('playwright-report') ||
         path.includes('tests/unit');
}

function findTestFiles(dir: string, baseDir: string = rootDir, files: Array<{source: string, target: string}> = []): Array<{source: string, target: string}> {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);
      
      if (shouldIgnorePath(relativePath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        if (entry.name === '__tests__') {
          // Found a __tests__ directory - collect all test files
          const testFiles = readdirSync(fullPath);
          for (const testFile of testFiles) {
            if (testFile.endsWith('.test.ts') || testFile.endsWith('.test.tsx')) {
              const sourcePath = join(fullPath, testFile);
              const parentDir = relative(baseDir, dir);
              
              let category = 'lib';
              let targetPath = '';
              
              // Determine category based on parent directory
              if (parentDir.includes('components')) {
                category = 'components';
                const compPath = parentDir.replace(/^components[\/\\]/, '').replace(/[\/\\]__tests__$/, '');
                targetPath = join(targetBase, 'components', compPath || '', testFile);
              } else if (parentDir.includes('app') && parentDir.includes('api')) {
                category = 'api';
                const apiPath = parentDir.replace(/^app[\/\\]api[\/\\]/, '').replace(/[\/\\]__tests__$/, '');
                targetPath = join(targetBase, 'api', apiPath || '', testFile);
              } else if (parentDir.includes('app')) {
                category = 'app';
                const appPath = parentDir.replace(/^app[\/\\]/, '').replace(/[\/\\]__tests__$/, '');
                targetPath = join(targetBase, 'app', appPath || '', testFile);
              } else if (parentDir.includes('lib')) {
                category = 'lib';
                const libPath = parentDir.replace(/^lib[\/\\]/, '').replace(/[\/\\]__tests__$/, '');
                targetPath = join(targetBase, 'lib', libPath || '', testFile);
              } else if (parentDir.startsWith('__tests__')) {
                // Root __tests__ folder
                const parts = parentDir.split(sep).filter(p => p && p !== '__tests__');
                if (parts.length > 0) {
                  category = parts[0] === 'components' || parts[0] === 'lib' || parts[0] === 'app' || parts[0] === 'api' 
                    ? parts[0] as any 
                    : 'lib';
                  targetPath = join(targetBase, category, ...parts.slice(1), testFile);
                } else {
                  targetPath = join(targetBase, 'lib', testFile);
                }
              } else {
                targetPath = join(targetBase, 'lib', testFile);
              }
              
              files.push({ source: sourcePath, target: targetPath });
            }
          }
        } else {
          // Recurse into subdirectories
          findTestFiles(fullPath, baseDir, files);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

console.log('Finding all remaining test files in __tests__ folders...');
const testFiles = findTestFiles(rootDir);
console.log(`Found ${testFiles.length} test files to move`);

let moved = 0;
let skipped = 0;
let errors = 0;

for (const { source, target } of testFiles) {
  try {
    // Skip if target already exists
    if (existsSync(target)) {
      skipped++;
      continue;
    }
    
    // Ensure target directory exists
    const targetDir = dirname(target);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy file to new location
    copyFileSync(source, target);
    console.log(`✓ Moved: ${relative(rootDir, source)} -> ${relative(rootDir, target)}`);
    moved++;
  } catch (error) {
    console.error(`✗ Error moving ${source}:`, error);
    errors++;
  }
}

console.log(`\n✅ Moved ${moved} test files, skipped ${skipped} (already exist), ${errors} errors`);


