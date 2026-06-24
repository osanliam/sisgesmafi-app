const fs = require('fs');

const file = 'GradingPortal.jsx';
let content = fs.readFileSync(file, 'utf8');

// We need to import createPortal
if (!content.includes('createPortal')) {
  content = content.replace("import React, {", "import React, {"); // no-op if exists
  content = content.replace("import React, { useState", "import { createPortal } from 'react-dom';\nimport React, { useState");
}

const titleStart = content.indexOf('{/* Selectors */}'); // We swapped them earlier!
const tabsStart = content.indexOf('{/* Tabs de Navegación de Vistas */}');

if (titleStart !== -1 && tabsStart !== -1) {
  let headerBlock = content.substring(titleStart, tabsStart);
  
  // Wrap the headerBlock with createPortal if the target element exists
  // We can do this dynamically:
  // const portalTarget = document.getElementById('classroom-context-header-slot');
  // const headerContent = <>{...}</>;
  // return ( ... portalTarget ? createPortal(headerContent, portalTarget) : headerContent ... )
  
  let newHeaderBlock = `
      {/* Contextual Header Portaled to ClassroomManager */}
      {(() => {
        const portalTarget = document.getElementById('classroom-context-header-slot');
        const headerContent = (
          <div className="flex flex-col gap-3 w-full">
${headerBlock}          </div>
        );
        return isEmbedded && portalTarget ? createPortal(headerContent, portalTarget) : headerContent;
      })()}
`;
  
  content = content.substring(0, titleStart) + newHeaderBlock + content.substring(tabsStart);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated GradingPortal.jsx to use createPortal.');
} else {
  console.log('Failed to find GradingPortal markers.');
}
