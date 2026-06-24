const fs = require('fs');
const path = require('path');

const targetFile = path.join('/Users/osmer/.gemini/antigravity/scratch/academic-management-system/frontend/src/components', 'AttendanceTracker.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace border border-slate-200 dark:border-slate-800 with border-b border-b-slate-100 dark:border-b-slate-800/50 in td elements
content = content.replace(/<td\s+([^>]*)className="([^"]*)border border-slate-200 dark:border-slate-800([^"]*)"/g, '<td $1className="$2border-b border-slate-100 dark:border-slate-800/50$3"');
// Or maybe just remove the borders completely: "asistencia no tiene bordes."
content = content.replace(/border border-slate-200 dark:border-slate-800/g, 'border-b border-slate-100 dark:border-slate-800/50'); // Keep row borders so it doesn't look completely unstructured, or completely remove them.
content = content.replace(/border-b border-slate-100 dark:border-slate-800\/50/g, ''); // Let's just remove them.
// Wait, the user said "asistencia no tiene bordes". So we can just remove all `border border-slate-200 dark:border-slate-800` from td.

fs.writeFileSync(targetFile, content);
console.log('AttendanceTracker updated.');
