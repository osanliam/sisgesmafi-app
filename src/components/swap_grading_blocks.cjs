const fs = require('fs');

const file = 'GradingPortal.jsx';
let content = fs.readFileSync(file, 'utf8');

const titleStart = content.indexOf('{/* Title */}');
const selectorsStart = content.indexOf('{/* Selectors */}');
const tabsStart = content.indexOf('{/* Tabs de Navegación de Vistas */}');

if (titleStart !== -1 && selectorsStart !== -1 && tabsStart !== -1) {
  const titleBlock = content.substring(titleStart, selectorsStart);
  const selectorsBlock = content.substring(selectorsStart, tabsStart);

  const newContent = content.substring(0, titleStart) + 
                     selectorsBlock + 
                     titleBlock + 
                     content.substring(tabsStart);
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('Swapped Title and Selectors blocks in GradingPortal.jsx');
} else {
  console.log('Could not find markers.');
}
