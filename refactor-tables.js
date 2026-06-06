const fs = require('fs');
const path = require('path');

const fileList = [
'C:/Gravity-project/schoolpro/src/app/(affiliate)/affiliate/commissions/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/attendance/gtk/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/attendance/students/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/canteen/merchants/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/finance/cashflow/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/finance/invoice/_components/invoice-list.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/finance/wallet/_components/wallet-manager.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/ppdb/pendaftar/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/ppdb/tagihan/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/settings/ai/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/settings/domain/_components/dns-guide-card.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/students/classrooms/[id]/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/students/import/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/students/promotion/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/users/guru/import/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/users/import/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/website/documents/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/website/events/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/website/pengumuman/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/admin/website/posts/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/dashboard/notifications/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/panel-gtk/ai/_components/gtk-ai-usage-history.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/panel-gtk/cbt/jadwal/[id]/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/panel-gtk/nilai/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(dashboard)/panel-gtk/posts/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/_components/SecurityLogs.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/ads-analytics/_components/ads-table.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/affiliates/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/affiliates/withdrawals/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/analytics/_components/finance-tab.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/analytics/_components/tenants-tab.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/applications/_components/application-table.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/features/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/notifications/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/payments/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/tenants/ai-packages/_components/ai-usage-history.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/tenants/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/users/[id]/page.tsx',
'C:/Gravity-project/schoolpro/src/app/(super-admin)/super-admin/users/page.tsx',
'C:/Gravity-project/schoolpro/src/app/invoice/[id]/page.tsx'
];

fileList.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('<table')) return;

  // Add import if needed
  if (!content.includes('import { Table')) {
    const importRegex = /(import .* from .*react.*\n)/;
    const match = content.match(importRegex);
    if (match) {
      content = content.replace(match[0], match[0] + 'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"\n');
    } else {
      content = 'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"\n' + content;
    }
  }

  // Tags replace
  content = content.replace(/<table[^>]*>/g, '<Table>');
  content = content.replace(/<\/table>/g, '</Table>');
  content = content.replace(/<thead[^>]*>/g, '<TableHeader>');
  content = content.replace(/<\/thead>/g, '</TableHeader>');
  content = content.replace(/<tbody[^>]*>/g, '<TableBody>');
  content = content.replace(/<\/tbody>/g, '</TableBody>');
  
  // Replace tr
  content = content.replace(/<tr([^>]*)>/g, '<TableRow$1>');
  content = content.replace(/<\/tr>/g, '</TableRow>');

  // Replace th
  content = content.replace(/<th([^>]*)>/g, '<TableHead$1>');
  content = content.replace(/<\/th>/g, '</TableHead>');

  // Replace td
  content = content.replace(/<td([^>]*)>/g, '<TableCell$1>');
  content = content.replace(/<\/td>/g, '</TableCell>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Processed:', file);
});
