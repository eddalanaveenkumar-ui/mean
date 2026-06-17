import fs from 'fs';
import path from 'path';

const sourceDir = 'C:\\Users\\Naveen Kumar\\.gemini\\antigravity\\brain\\eafa0ad7-91a9-4479-9874-d1e31d2d2574';
const destDir = path.resolve('public');

const mappings = {
  'media__1781723675956.png': 'openai.png',
  'media__1781723677226.png': 'replit.png',
  'media__1781723678526.png': 'xai.png',
  'media__1781723682069.png': 'grok.png',
  'media__1781723683713.png': 'deepseek-logo.png',
  'media__1781723824328.jpg': 'loveble.jpg',
};

// Ensure destDir exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

Object.entries(mappings).forEach(([srcName, destName]) => {
  const srcPath = path.join(sourceDir, srcName);
  const destPath = path.join(destDir, destName);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${srcName} -> ${destName}`);
  } else {
    console.warn(`Source not found: ${srcPath}`);
  }
});
