let fs = require('fs');
let dashboard = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
let bentoStart = dashboard.indexOf('<div className="md:p-4 overflow-y-auto">');
let bentoHtml = dashboard.substring(bentoStart);
// just take everything from bentoStart to the final return closing
let match = bentoHtml.match(/([\s\S]*?)(\s*\}\s*)$/);
if (match) {
    bentoHtml = match[1]; // drop the closing }
}
let match2 = bentoHtml.match(/([\s\S]*?)(\s*\);\s*)$/);
if (match2) {
    bentoHtml = match2[1]; // drop the closing );
}

let opens = (bentoHtml.match(/<div/g) || []).length;
let closes = (bentoHtml.match(/<\/div>/g) || []).length;
console.log('Ends with:', bentoHtml.substring(bentoHtml.length - 100));
console.log('Counts:', opens, closes);
