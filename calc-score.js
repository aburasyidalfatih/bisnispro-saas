const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log("Calculating leaderboard scores...");
  
  const tenants = await db.tenant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED", deletedAt: null } },
          staff: true,
          facilities: true,
          events: true,
          achievements: true
        }
      },
      gallery: true,
      tenantScore: true
    }
  });

  const scores = [];

  for (const tenant of tenants) {
    const postPoints = (tenant._count.posts || 0) * 20;
    const staffPoints = (tenant._count.staff || 0) * 10;
    const facilityPoints = (tenant._count.facilities || 0) * 15;
    const eventPoints = (tenant._count.events || 0) * 15;
    const achievementPoints = (tenant._count.achievements || 0) * 20;
    
    let galleryItems = 0;
    if (tenant.gallery) {
      if (Array.isArray(tenant.gallery)) galleryItems = tenant.gallery.length;
      else if (typeof tenant.gallery === 'object' && Array.isArray(tenant.gallery.images)) galleryItems = tenant.gallery.images.length;
    }
    const galleryPoints = galleryItems * 5;

    const contentScore = postPoints + staffPoints + facilityPoints + eventPoints + achievementPoints + galleryPoints;
    const trafficScore = tenant.tenantScore?.trafficScore || 0;
    const activityScore = 0; 
    const totalScore = contentScore + trafficScore + activityScore;

    scores.push({
      tenantId: tenant.id,
      contentScore,
      trafficScore,
      activityScore,
      totalScore,
    });
  }

  scores.sort((a, b) => b.totalScore - a.totalScore);

  const updatePromises = scores.map((score, index) => {
    const rank = index + 1;
    return db.tenantScore.upsert({
      where: { tenantId: score.tenantId },
      update: {
        contentScore: score.contentScore,
        activityScore: score.activityScore,
        totalScore: score.totalScore,
        rank: rank,
        lastCalculated: new Date()
      },
      create: {
        tenantId: score.tenantId,
        contentScore: score.contentScore,
        trafficScore: score.trafficScore,
        activityScore: score.activityScore,
        totalScore: score.totalScore,
        rank: rank,
        lastCalculated: new Date()
      }
    });
  });

  await db.$transaction(updatePromises);
  console.log(`Successfully calculated scores for ${tenants.length} tenants!`);
}

main().catch(console.error).finally(() => db.$disconnect());
