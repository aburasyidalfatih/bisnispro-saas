import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCoordinates() {
  const tenants = await prisma.tenant.findMany({
    select: {
      name: true,
      latitude: true,
      longitude: true,
      province: true,
      city: true
    },
    where: {
      latitude: { not: null },
      longitude: { not: null }
    }
  });

  const outliers = tenants.filter(t => {
    const lat = parseFloat(t.latitude!);
    const lng = parseFloat(t.longitude!);
    // Sumatra is roughly between 95 and 106 longitude.
    // The main cluster is on land. Let's find anything with longitude < 100 and latitude < -1 (South of equator and far west)
    // Or just print them out sorted by longitude
    return true; // We'll just sort and print the most extreme ones
  });

  // Sort by longitude ascending (furthest west)
  outliers.sort((a, b) => parseFloat(a.longitude!) - parseFloat(b.longitude!));
  
  console.log("=== PALING BARAT (Kiri) ===");
  outliers.slice(0, 5).forEach(t => console.log(`${t.name} | Lat: ${t.latitude}, Lng: ${t.longitude} | ${t.city}, ${t.province}`));

  // Sort by latitude descending (furthest south)
  outliers.sort((a, b) => parseFloat(a.latitude!) - parseFloat(b.latitude!));
  console.log("\n=== PALING SELATAN (Bawah) ===");
  outliers.slice(0, 5).forEach(t => console.log(`${t.name} | Lat: ${t.latitude}, Lng: ${t.longitude} | ${t.city}, ${t.province}`));
}

checkCoordinates().catch(console.error).finally(() => prisma.$disconnect());
