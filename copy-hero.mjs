import { copyFileSync } from 'fs';
const src = 'C:\\Users\\Naveen Kumar\\.gemini\\antigravity\\brain\\e945c394-0cfe-4c1b-8ef6-f5568530eda0\\hero_3d_scene_1780850955266.png';
const dest = 'c:\\Users\\Naveen Kumar\\PycharmProjects\\shark\\mean-ai\\public\\hero-3d.png';
copyFileSync(src, dest);
console.log('Copied hero image to public/hero-3d.png');
