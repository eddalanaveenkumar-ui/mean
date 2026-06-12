import fs from 'fs';

const filePath = 'public/roadmap.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let output = '';
  lines.forEach((line, idx) => {
    if (line.includes('<input') || line.includes('<textarea') || line.includes('prompt') || line.includes('doubt')) {
      output += `Line ${idx + 1}: ${line.trim()}\n`;
    }
  });
  fs.writeFileSync('find_output.txt', output);
} else {
  fs.writeFileSync('find_output.txt', 'File not found');
}
