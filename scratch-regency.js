const { getRegencies } = require('idn-area-data');
const fs = require('fs');

getRegencies().then(data => {
  const sumatera = fs.readFileSync('src/lib/data/regencies-sumatera-jawa.ts', 'utf8');
  const lainnya = fs.readFileSync('src/lib/data/regencies-lainnya.ts', 'utf8');
  const allDataStr = sumatera + lainnya;
  
  // Clean string matching helper
  const cleanStr = (s) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  const missing = data.filter(r => {
    return !allDataStr.toLowerCase().includes(r.name.toLowerCase());
  });

  let out = '';
  missing.forEach(m => {
    out += `  ["${m.code.replace('.', '')}","${m.province_code}","${m.name}",0,0],\n`;
  });
  console.log(out);
});
