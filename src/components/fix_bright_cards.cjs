const fs = require('fs');
const path = require('path');

const filesToTransform = [
  'ClassroomManager.jsx',
  'AttendanceTracker.jsx',
  'GradingPortal.jsx',
  'ConductLogger.jsx',
  'ReinforcementGrading.jsx'
];

for (const file of filesToTransform) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace light bg colors with tinted dark backgrounds
  const colors = ['rose', 'red', 'amber', 'yellow', 'emerald', 'green', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink'];
  
  colors.forEach(color => {
    // Replace bg-color-50 (not followed by /something)
    const bg50Regex = new RegExp(`bg-${color}-50(?!\\/[0-9]+)`, 'g');
    content = content.replace(bg50Regex, `bg-${color}-500/10`);
    
    // Replace bg-color-100 (not followed by /something)
    const bg100Regex = new RegExp(`bg-${color}-100(?!\\/[0-9]+)`, 'g');
    content = content.replace(bg100Regex, `bg-${color}-500/20`);

    // Replace border-color-100/200
    const border100Regex = new RegExp(`border-${color}-100(?!\\/[0-9]+)`, 'g');
    content = content.replace(border100Regex, `border-${color}-500/20`);
    
    const border200Regex = new RegExp(`border-${color}-200(?!\\/[0-9]+)`, 'g');
    content = content.replace(border200Regex, `border-${color}-500/30`);
  });

  // Also replace any bg-slate-50 or bg-gray-50
  content = content.replace(/bg-slate-50(?!\/[0-9]+)/g, 'bg-white/5');
  content = content.replace(/bg-gray-50(?!\/[0-9]+)/g, 'bg-white/5');
  content = content.replace(/bg-slate-100(?!\/[0-9]+)/g, 'bg-white/10');
  content = content.replace(/bg-gray-100(?!\/[0-9]+)/g, 'bg-white/10');

  // Let's also check for text-slate-800 or text-slate-900 that might have been missed
  content = content.replace(/text-slate-900/g, 'text-white');
  content = content.replace(/text-slate-800/g, 'text-slate-200');

  fs.writeFileSync(filePath, content);
}
