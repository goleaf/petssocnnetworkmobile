/**
 * Script to move all test files from __tests__ folders to centralized tests/unit/ folder
 * This ensures all tests are in one location for easier maintenance
 */

import { readdir, mkdir, stat, copyFile, unlink } from 'fs/promises';
import { join, dirname, relative, sep } from 'path';
import { existsSync } from 'fs';

const rootDir = process.cwd();
const targetDir = join(rootDir, 'tests', 'unit');

interface TestFile {
  source: string;
  target: string;
  type: 'component' | 'lib' | 'app' | 'api';
}

async function findTestFiles(dir: string, baseDir: string = rootDir): Promise<TestFile[]> {
  const files: TestFile[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await findTestFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx'))) {
        // Determine target location based on source path
        let type: 'component' | 'lib' | 'app' | 'api' = 'lib';
        let targetPath = '';
        
        if (relativePath.includes('components')) {
          type = 'component';
          // Extract component path after components/
          const match = relativePath.match(/components[/\\](.+?)[/\\]__tests__/);
          if (match) {
            targetPath = join(targetDir, 'components', match[1], entry.name);
          } else {
            targetPath = join(targetDir, 'components', entry.name);
          }
        } else if (relativePath.includes('app') && relativePath.includes('api')) {
          type = 'api';
          // Extract api path after app/api/
          const match = relativePath.match(/app[/\\]api[/\\](.+?)[/\\]__tests__/);
          if (match) {
            targetPath = join(targetDir, 'api', match[1], entry.name);
          } else {
            targetPath = join(targetDir, 'api', entry.name);
          }
        } else if (relativePath.includes('app')) {
          type = 'app';
          // Extract app path after app/
          const match = relativePath.match(/app[/\\](.+?)[/\\]__tests__/);
          if (match) {
            targetPath = join(targetDir, 'app', match[1], entry.name);
          } else {
            targetPath = join(targetDir, 'app', entry.name);
          }
        } else if (relativePath.includes('lib')) {
          type = 'lib';
          // Extract lib path after lib/
          const match = relativePath.match(/lib[/\\](.+?)[/\\]__tests__/);
          if (match) {
            targetPath = join(targetDir, 'lib', match[1], entry.name);
          } else {
            targetPath = join(targetDir, 'lib', entry.name);
          }
        } else {
          // Root __tests__ folder
          if (relativePath.includes('__tests__')) {
            const parts = relativePath.split(sep);
            const testIndex = parts.indexOf('__tests__');
            if (testIndex >= 0 && testIndex < parts.length - 1) {
              // Get the directory structure before __tests__
              const beforeTests = parts.slice(0, testIndex);
              if (beforeTests.length > 0) {
                const category = beforeTests[beforeTests.length - 1];
                if (['components', 'lib', 'app', 'api'].includes(category)) {
                  type = category as any;
                  targetPath = join(targetDir, category, entry.name);
                } else {
                  targetPath = join(targetDir, 'lib', ...beforeTests, entry.name);
                }
              } else {
                targetPath = join(targetDir, 'lib', entry.name);
              }
            } else {
              targetPath = join(targetDir, 'lib', entry.name);
            }
          } else {
            targetPath = join(targetDir, 'lib', entry.name);
          }
        }
        
        files.push({
          source: fullPath,
          target: targetPath,
          type,
        });
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

async function moveTestFiles(): Promise<void> {
  console.log('Finding test files...');
  const testFiles = await findTestFiles(rootDir);
  
  console.log(`Found ${testFiles.length} test files to move`);
  
  for (const file of testFiles) {
    try {
      // Ensure target directory exists
      await ensureDirectoryExists(dirname(file.target));
      
      // Check if target already exists
      if (existsSync(file.target)) {
        console.log(`Skipping ${file.source} - target already exists`);
        continue;
      }
      
      // Copy file to new location
      await copyFile(file.source, file.target);
      console.log(`Moved: ${relative(rootDir, file.source)} -> ${relative(rootDir, file.target)}`);
      
      // Delete original file (commented out for safety - uncomment after verification)
      // await unlink(file.source);
      
    } catch (error) {
      console.error(`Error moving ${file.source}:`, error);
    }
  }
  
  console.log('Done! Test files have been copied to tests/unit/');
  console.log('Please verify the files and then delete the original __tests__ folders manually.');
}

moveTestFiles().catch(console.error);




