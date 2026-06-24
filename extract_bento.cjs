let fs = require('fs');
let dashboard = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
let bentoStart = dashboard.indexOf('<div className="md:p-4 overflow-y-auto">');
let bentoHtml = dashboard.substring(bentoStart);
let endIdx = bentoHtml.indexOf('  );\n}');
bentoHtml = bentoHtml.substring(0, endIdx).trim();

let opens = (bentoHtml.match(/<div/g) || []).length;
let closes = (bentoHtml.match(/<\/div>/g) || []).length;
console.log('Counts:', opens, closes);
