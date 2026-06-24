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

  // Fix badly formed bg-white classes
  content = content.replace(/bg-white\/50\/[0-9]+/g, 'bg-white/5');
  content = content.replace(/bg-white\/10\/50/g, 'bg-white/5');
  content = content.replace(/bg-white\/5\/20/g, 'bg-white/5');
  content = content.replace(/bg-white\/40/g, 'bg-white/5');
  content = content.replace(/bg-white\/50/g, 'bg-white/10');
  content = content.replace(/text-slate-450/g, 'text-slate-400');
  content = content.replace(/text-slate-250/g, 'text-slate-300');
  content = content.replace(/text-slate-550/g, 'text-slate-400');
  
  // Specific fix for empty strings replacing dark:
  // Instead of matching \s+, let's match literal spaces to avoid nuking newlines
  content = content.replace(/className=" +/g, 'className="');
  content = content.replace(/ +"/g, '"');

  fs.writeFileSync(filePath, content);
}
