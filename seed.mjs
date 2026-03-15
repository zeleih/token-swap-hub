import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

async function main() {
  const code = "EARLYBIRD";
  
  // Create an admin user to own the invite code if we have to, or just create it
  let sysAdmin = await prisma.user.findFirst({ where: { email: "admin@system.local" }});
  
  if (!sysAdmin) {
     sysAdmin = await prisma.user.create({
       data: {
         email: "admin@system.local",
         passwordHash: "fake_hash", // Admin shouldn't just log in without config
         role: "ADMIN",
         platformKey: "tk_admin_system_key",
         points: 999999
       }
     });
  }

  const existing = await prisma.inviteCode.findUnique({ where: { code } });
  if (!existing) {
    await prisma.inviteCode.create({
      data: {
        code,
        maxUses: 100,
        creatorId: sysAdmin.id
      }
    });
    console.log(`Invite code generated: ${code}`);
  } else {
    console.log(`Invite code already exists.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
