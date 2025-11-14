import * as fs from 'fs';
import * as path from 'path';

interface TestFile {
  from: string;
  to: string;
  type: 'component' | 'lib' | 'app' | 'api';
}

const testFiles: TestFile[] = [];

/**
 * Find all test files in __tests__ folders
 */
function findTestFiles(dir: string, baseDir: string = ''): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir || process.cwd(), fullPath);

    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '.git') {
        // Process __tests__ folder contents
        if (entry.name === '__tests__') {
          const testEntries = fs.readdirSync(fullPath, { withFileTypes: true });
          for (const testEntry of testEntries) {
            if (testEntry.isFile() && (testEntry.name.endsWith('.test.ts') || testEntry.name.endsWith('.test.tsx') || testEntry.name.endsWith('.spec.ts'))) {
              const testFilePath = path.join(fullPath, testEntry.name);
              determineDestination(testFilePath, relativePath, testEntry.name);
            }
          }
        }
      } else {
        findTestFiles(fullPath, baseDir);
      }
    }
  }
}

/**
 * Determine destination based on source path
 */
function determineDestination(testFilePath: string, relativePath: string, fileName: string): void {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  let type: 'component' | 'lib' | 'app' | 'api' = 'lib';
  let destPath = '';

  // Determine type based on path
  if (normalizedPath.includes('/components/') || normalizedPath.includes('\\components\\')) {
    type = 'component';
    // Extract component path after components/
    const match = normalizedPath.match(/components[/\\](.+?)[/\\]__tests__/);
    if (match) {
      const componentPath = match[1].replace(/\\/g, '/');
      destPath = `tests/unit/components/${componentPath}/${fileName}`;
    } else {
      destPath = `tests/unit/components/${fileName}`;
    }
  } else if (normalizedPath.includes('/app/api/') || normalizedPath.includes('\\app\\api\\')) {
    type = 'api';
    // Extract API route path after api/
    const match = normalizedPath.match(/app[/\\]api[/\\](.+?)[/\\]__tests__/);
    if (match) {
      const apiPath = match[1].replace(/\\/g, '/');
      destPath = `tests/unit/api/${apiPath}/${fileName}`;
    } else {
      const match2 = normalizedPath.match(/app[/\\]api[/\\]__tests__[/\\](.+)/);
      if (match2) {
        const apiPath = match2[1].replace(/\\/g, '/');
        destPath = `tests/unit/api/${apiPath}`;
      } else {
        destPath = `tests/unit/api/${fileName}`;
      }
    }
  } else if (normalizedPath.includes('/app/') || normalizedPath.includes('\\app\\')) {
    type = 'app';
    // Extract app page path after app/
    const match = normalizedPath.match(/app[/\\](.+?)[/\\]__tests__/);
    if (match) {
      const appPath = match[1].replace(/\\/g, '/');
      destPath = `tests/unit/app/${appPath}/${fileName}`;
    } else {
      const match2 = normalizedPath.match(/app[/\\]__tests__[/\\](.+)/);
      if (match2) {
        const appPath = match2[1].replace(/\\/g, '/');
        destPath = `tests/unit/app/${appPath}`;
      } else {
        destPath = `tests/unit/app/${fileName}`;
      }
    }
  } else if (normalizedPath.includes('/lib/') || normalizedPath.includes('\\lib\\')) {
    type = 'lib';
    // Extract lib path after lib/
    const match = normalizedPath.match(/lib[/\\](.+?)[/\\]__tests__/);
    if (match) {
      const libPath = match[1].replace(/\\/g, '/');
      destPath = `tests/unit/lib/${libPath}/${fileName}`;
    } else {
      const match2 = normalizedPath.match(/lib[/\\]__tests__[/\\](.+)/);
      if (match2) {
        const libPath = match2[1].replace(/\\/g, '/');
        destPath = `tests/unit/lib/${libPath}`;
      } else {
        destPath = `tests/unit/lib/${fileName}`;
      }
    }
  } else if (normalizedPath.startsWith('__tests__/')) {
    // Root level __tests__ folder
    if (normalizedPath.includes('/components/')) {
      type = 'component';
      const match = normalizedPath.match(/__tests__[/\\]components[/\\](.+)/);
      if (match) {
        destPath = `tests/unit/components/${match[1]}`;
      } else {
        destPath = `tests/unit/components/${fileName}`;
      }
    } else if (normalizedPath.includes('/api/')) {
      type = 'api';
      const match = normalizedPath.match(/__tests__[/\\]api[/\\](.+)/);
      if (match) {
        destPath = `tests/unit/api/${match[1]}`;
      } else {
        destPath = `tests/unit/api/${fileName}`;
      }
    } else if (normalizedPath.includes('/app/')) {
      type = 'app';
      const match = normalizedPath.match(/__tests__[/\\]app[/\\](.+)/);
      if (match) {
        destPath = `tests/unit/app/${match[1]}`;
      } else {
        destPath = `tests/unit/app/${fileName}`;
      }
    } else if (normalizedPath.includes('/lib/')) {
      type = 'lib';
      const match = normalizedPath.match(/__tests__[/\\]lib[/\\](.+)/);
      if (match) {
        destPath = `tests/unit/lib/${match[1]}`;
      } else {
        destPath = `tests/unit/lib/${fileName}`;
      }
    } else {
      // Unknown root level test, put in lib as default
      type = 'lib';
      destPath = `tests/unit/lib/${fileName}`;
    }
  } else {
    // Default to lib
    type = 'lib';
    destPath = `tests/unit/lib/${fileName}`;
  }

  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Check if destination already exists (might be a duplicate)
  if (fs.existsSync(destPath)) {
    // Compare file contents to see if it's a duplicate
    const sourceContent = fs.readFileSync(testFilePath, 'utf-8');
    const destContent = fs.readFileSync(destPath, 'utf-8');
    if (sourceContent === destContent) {
      console.log(`Skipping duplicate: ${testFilePath} -> ${destPath}`);
      return;
    } else {
      // Different content, rename to avoid conflict
      const baseName = path.basename(fileName, path.extname(fileName));
      const ext = path.extname(fileName);
      let counter = 1;
      let newDestPath = destPath;
      while (fs.existsSync(newDestPath)) {
        newDestPath = path.join(destDir, `${baseName}-${counter}${ext}`);
        counter++;
      }
      destPath = newDestPath;
    }
  }

  testFiles.push({
    from: testFilePath,
    to: destPath,
    type
  });
}

/**
 * Move test files
 */
function moveTestFiles(): void {
  console.log(`Found ${testFiles.length} test files to move\n`);

  let moved = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of testFiles) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(file.to);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Check if already exists and is identical
      if (fs.existsSync(file.to)) {
        const sourceContent = fs.readFileSync(file.from, 'utf-8');
        const destContent = fs.readFileSync(file.to, 'utf-8');
        if (sourceContent === destContent) {
          console.log(`Skipping duplicate: ${file.from} -> ${file.to}`);
          skipped++;
          // Still remove source if it's a duplicate
          fs.unlinkSync(file.from);
          continue;
        }
      }

      // Move file
      fs.renameSync(file.from, file.to);
      console.log(`Moved: ${file.from} -> ${file.to}`);
      moved++;

      // Try to remove empty __tests__ folder
      const sourceDir = path.dirname(file.from);
      if (fs.existsSync(sourceDir) && sourceDir.includes('__tests__')) {
        try {
          const remainingFiles = fs.readdirSync(sourceDir);
          if (remainingFiles.length === 0) {
            fs.rmdirSync(sourceDir);
            console.log(`Removed empty directory: ${sourceDir}`);
          }
        } catch (e) {
          // Ignore errors removing directory
        }
      }
    } catch (error) {
      console.error(`Error moving ${file.from}:`, error);
      errors++;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Moved: ${moved}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

// Main execution
const rootDir = process.cwd();
console.log(`Searching for test files in: ${rootDir}\n`);

// Find all test files
findTestFiles(rootDir, rootDir);

// Move test files
if (testFiles.length > 0) {
  moveTestFiles();
} else {
  console.log('No test files found in __tests__ folders.');
}





