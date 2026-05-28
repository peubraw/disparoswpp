import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcryptjs.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@test.com",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
