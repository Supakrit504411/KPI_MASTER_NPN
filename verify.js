const fs = require('fs');
const d = fs.readFileSync('./data.csv', 'utf-8');
const lines = d.trim().split('\n');

const peas = { 'กฟส.นพ.': { I: 0, J: 0 }, 'กฟส.ธพ.': { I: 0, J: 0 }, 'กฟส.นก.': { I: 0, J: 0 }, 'กฟส.บพง.': { I: 0, J: 0 } };

for (let i = 1; i < lines.length; i++) {
  const m = lines[i].match(/"([^"]*)"/g) || [];
  if (m.length >= 11 && peas[m[2]]) {
    const scoreNet = parseFloat(m[8]) || 0;  // Column I = index 8
    const scoreFull = parseFloat(m[9]) || 0; // Column J = index 9
    peas[m[2]].I += scoreNet;
    peas[m[2]].J += scoreFull;
  }
}

console.log('=== ผลรวมคะแนนราย PEA ===');
for (const [pea, v] of Object.entries(peas)) {
  console.log(pea, '| Column I (คะแนนสุทธิ):', Math.round(v.I * 100) / 100, '| Column J (คะแนนเต็ม):', Math.round(v.J * 100) / 100);
}
