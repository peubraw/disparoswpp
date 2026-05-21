import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcryptjs.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      name: "Admin",
      passwordHash,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
