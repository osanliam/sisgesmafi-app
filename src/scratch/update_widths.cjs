const fs = require('fs');
const path = require('path');

function updateFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(filePath, content);
}

const p = (file) => path.join('/Users/osmer/.gemini/antigravity/scratch/academic-management-system/frontend/src/components', file);

// AttendanceTracker.jsx
const attendanceReplacements = [
    // Table td borders
    ['border border-slate-200 dark:border-slate-800', 'border-b border-slate-100 dark:border-slate-800/40'],
    ['rounded-xl', 'rounded-lg'],
];
updateFile(p('AttendanceTracker.jsx'), attendanceReplacements);

// GradingPortal.jsx
const gradingReplacements = [
    ['min-w-[150px] max-w-[200px]', 'min-w-[120px] max-w-[150px]'],
    ['min-w-[200px]', 'min-w-[150px]'],
    ['min-w-[140px]', 'min-w-[110px]'],
    ['rounded-xl', 'rounded-lg'], // To make sure everything is rounded-lg maybe? But wait, I'll just change the specific width classes.
    ['w-28', 'w-20'],
    ['w-24', 'w-16'],
    ['w-16', 'w-10'],
];
updateFile(p('GradingPortal.jsx'), gradingReplacements);

// ReinforcementGrading.jsx
const reinfReplacements = [
    ['min-w-[150px] max-w-[200px]', 'min-w-[120px] max-w-[150px]'],
    ['min-w-[200px]', 'min-w-[150px]'],
    ['min-w-[140px]', 'min-w-[110px]'],
    ['rounded-xl', 'rounded-lg'],
    ['w-28', 'w-20'],
    ['w-24', 'w-16'],
    ['w-16', 'w-10'],
];
updateFile(p('ReinforcementGrading.jsx'), reinfReplacements);

console.log('Update complete.');
