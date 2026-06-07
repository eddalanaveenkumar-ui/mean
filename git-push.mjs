import { copyFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const src = 'C:\\Users\\Naveen Kumar\\.gemini\\antigravity\\brain\\e945c394-0cfe-4c1b-8ef6-f5568530eda0\\hero_3d_scene_1780850955266.png';
const dest = 'c:\\Users\\Naveen Kumar\\PycharmProjects\\shark\\mean-ai\\public\\hero-3d.png';

// 1. Copy the 3D hero image
console.log('Copying hero image...');
if (existsSync(src)) {
  copyFileSync(src, dest);
  console.log('Copied hero image successfully to public/hero-3d.png');
} else {
  console.log('Generated hero image not found at source path, skipping copy...');
}

// 2. Git automation
try {
  console.log('Running git status...');
  console.log(execSync('git status', { encoding: 'utf8' }));

  console.log('Adding files...');
  execSync('git add .');

  console.log('Committing changes...');
  const commitMsg = 'feat: implement premium 3D landing page matching Stitch AI design';
  console.log(execSync(`git commit -m "${commitMsg}"`, { encoding: 'utf8' }));

  console.log('Pushing to repository...');
  console.log(execSync('git push', { encoding: 'utf8' }));
  console.log('Successfully pushed to repository!');
} catch (error) {
  console.error('Failed to execute git commands:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.error('stderr:', error.stderr);
}
