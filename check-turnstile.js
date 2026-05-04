process.env.DATABASE_URL = "postgresql://postgres:ganti-dengan-password-kuat-di-production@localhost:5432/saasmasterpro";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.platformSetting.findUnique({where:{key:'TURNSTILE_SITE_KEY'}})
  .then(res => { console.log(res); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
