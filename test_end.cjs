let fs = require('fs');
let dashboard = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
let bentoStart = dashboard.indexOf('<div className="md:p-4 overflow-y-auto">');
let bentoEnd = dashboard.lastIndexOf('</div>\n    </div>\n  );\n}');
let bentoHtml = dashboard.substring(bentoStart, bentoEnd + 6);
console.log('Ends with:', bentoHtml.substring(bentoHtml.length - 100));
