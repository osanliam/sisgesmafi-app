const fs = require('fs');
let dashboard = fs.readFileSync('Dashboard.jsx', 'utf8');
let bentoStart = dashboard.indexOf('<div className="md:p-4 overflow-y-auto">');
let bentoEnd = dashboard.indexOf('{/* Latest Activities List */}');
if (bentoEnd === -1) {
    bentoEnd = dashboard.indexOf('</div>\n    </div>\n  );\n}');
} else {
    let flexEnd = dashboard.substring(bentoStart, bentoEnd).lastIndexOf('</div>');
    bentoEnd = bentoStart + flexEnd + 6;
}

let bentoHtml = dashboard.substring(bentoStart, bentoEnd);
console.log((bentoHtml.match(/<div/g) || []).length, (bentoHtml.match(/<\/div>/g) || []).length);
