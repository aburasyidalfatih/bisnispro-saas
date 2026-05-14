const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL || 'http://schoolpro-dev-umami-1:3000';
const UMAMI_USERNAME = process.env.UMAMI_ADMIN_USERNAME || 'admin';
const UMAMI_PASSWORD = process.env.UMAMI_ADMIN_PASSWORD || 'Kamil12@';
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';

let cachedToken = null;

async function getUmamiToken() {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UMAMI_USERNAME, password: UMAMI_PASSWORD })
  });
  if (!res.ok) throw new Error(`Umami login failed: ${res.statusText}`);
  const data = await res.json();
  cachedToken = data.token;
  return data.token;
}

async function createUmamiWebsite(domain, name) {
  const token = await getUmamiToken();
  const res = await fetch(`${UMAMI_URL}/api/websites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ domain, name })
  });
  if (!res.ok) throw new Error(`Umami create failed: ${res.statusText}`);
  const data = await res.json();
  return data.id;
}

async function main() {
  console.log("Fetching tenants without Umami...");
  const tenants = await db.tenant.findMany({
    where: { umamiWebsiteId: null },
    select: { id: true, slug: true, name: true, domain: true }
  });

  console.log(`Found ${tenants.length} tenants needing Umami setup.`);

  for (const tenant of tenants) {
    try {
      const fullDomain = tenant.domain || `${tenant.slug}.${ROOT_DOMAIN}`;
      console.log(`Creating tracker for ${tenant.name} (${fullDomain})...`);
      const umamiId = await createUmamiWebsite(fullDomain, tenant.name);
      
      await db.tenant.update({
        where: { id: tenant.id },
        data: { umamiWebsiteId: umamiId }
      });
      console.log(`Success: ${tenant.name} -> ${umamiId}`);
    } catch (e) {
      console.error(`Failed for ${tenant.name}:`, e.message);
    }
  }

  console.log("Done syncing existing tenants!");
}

main().catch(console.error).finally(() => db.$disconnect());
