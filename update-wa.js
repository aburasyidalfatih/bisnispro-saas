const fs = require('fs');
let file = fs.readFileSync('src/app/(super-admin)/super-admin/settings/_components/whatsapp-tab.tsx', 'utf8');

const fields = [
  'PENDING',
  'APPROVED',
  'REVISION',
  'REJECTED',
  'ALERT_SUPERADMIN',
  'ALERT_AFFILIATE',
  'INVOICE_CREATED',
  'PAYMENT_CONFIRMED',
  'AFFILIATE_COMMISSION',
  'SUBSCRIPTION_REMINDER',
  'PAYMENT_SUCCESS_SUPERADMIN',
  'WITHDRAWAL_REQUEST_SUPERADMIN',
  'INVOICE_EXPIRED_SUPERADMIN'
];

fields.forEach((base) => {
  const findRegex = new RegExp('<Textarea value={form\\.WA_TEMPLATE_' + base + '} [\\s\\S]*? />');
  const match = file.match(findRegex);
  if (match) {
    const replacement = match[0] + '\n              {form.WA_ACTIVE_PROVIDER === "wavio" && (\n                <div className="mt-2 space-y-1">\n                  <Label className="text-orange-600 text-[11px] font-semibold">Nama Template Wavio (Khusus WA)</Label>\n                  <Input value={form.WAVIO_TPL_' + base + '} onChange={e => setForm({...form, WAVIO_TPL_' + base + ': e.target.value})} placeholder="Nama Template Wavio" className="text-xs font-mono rounded-xl h-8" disabled={form.WA_ENABLE_' + base + ' !== "true"} />\n                </div>\n              )}';
    file = file.replace(match[0], replacement);
  }
});

const saveBtnRegex = /handleSaveBatch\(\[([\s\S]*?)\]\)/;
const saveBtnMatch = file.match(saveBtnRegex);
if(saveBtnMatch) {
  let innerFields = saveBtnMatch[1];
  fields.forEach((base) => {
    innerFields += ", 'WAVIO_TPL_" + base + "'";
  });
  file = file.replace(saveBtnMatch[0], 'handleSaveBatch([' + innerFields + '])');
}

fs.writeFileSync('src/app/(super-admin)/super-admin/settings/_components/whatsapp-tab.tsx', file);
