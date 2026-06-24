const fs = require('fs');
const path = require('path');
const file = path.join('/Users/osmer/.gemini/antigravity/scratch/academic-management-system/frontend/src/components/AttendanceTracker.jsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/border-b border-slate-100 dark:border-slate-800\/40/g, 'border-none');
fs.writeFileSync(file, content);
console.log('Attendance borders removed completely.');
