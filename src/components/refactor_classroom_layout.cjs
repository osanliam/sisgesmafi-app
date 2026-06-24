const fs = require('fs');

const file = 'ClassroomManager.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Modify the Header flex layout in ClassroomManager.jsx
// It currently has:
// <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//   <div className="flex items-center gap-4 flex-1"> ... <div className="glass-card-ecc tint-cyan ... </div> </div>
//   {/* Global period control if a class is active */} ... </div>
// </div>

const headerStartStr = '{/* 1. Header with selector status */}';
const headerEndStr = '{/* 2. Mockup 6-Cards Grid Layout (Only active if a course is selected) */}';

const headerStartIdx = content.indexOf(headerStartStr);
const headerEndIdx = content.indexOf(headerEndStr);

if (headerStartIdx !== -1 && headerEndIdx !== -1) {
  let oldHeader = content.substring(headerStartIdx, headerEndIdx);
  
  // We want to replace it with a layout that puts "Gestión de Aula" on the left,
  // and stacks the Period Control + Context Slot on the right.
  // Note: we can just add <div id="classroom-context-header-slot" className="empty:hidden flex flex-col gap-3"></div>
  // below the Period control.
  
  let newHeader = oldHeader.replace(
    '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">',
    '<div className="flex flex-col lg:flex-row items-stretch justify-between gap-4">'
  );
  
  newHeader = newHeader.replace(
    '<div className="flex items-center gap-4 flex-1">',
    '<div className="flex items-stretch gap-4 w-full lg:w-auto shrink-0 h-full">'
  );
  
  newHeader = newHeader.replace(
    '<div className="glass-card-ecc tint-cyan p-6 rounded-3xl w-full sm:w-auto border-l-4 border-l-kinetic-cyan relative overflow-hidden">',
    '<div className="glass-card-ecc tint-cyan p-6 rounded-3xl w-full sm:w-64 border-l-4 border-l-kinetic-cyan relative overflow-hidden flex flex-col justify-center">'
  );
  
  newHeader = newHeader.replace(
    '{/* Global period control if a class is active */}',
    '<div className="flex flex-col gap-3 w-full flex-1 justify-start">\n        {/* Global period control if a class is active */}'
  );
  
  newHeader = newHeader.replace(
    /<\/div>\s*<\/div>\s*$/,
    '</div>\n        <div id="classroom-context-header-slot" className="empty:hidden flex flex-col gap-3 w-full"></div>\n        </div>\n      </div>\n'
  );

  content = content.substring(0, headerStartIdx) + newHeader + content.substring(headerEndIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated ClassroomManager.jsx header layout.');
} else {
  console.log('Failed to find ClassroomManager header markers.');
}
