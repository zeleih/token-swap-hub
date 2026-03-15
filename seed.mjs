import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const code = "EARLYBIRD";
  
  let sysAdmin = await prisma.user.findFirst({ where: { username: "admin" }});
  
  if (!sysAdmin) {
     sysAdmin = await prisma.user.create({
       data: {
         username: "admin",
         displayName: "系统管理员",
         passwordHash: "fake_hash",
         role: "ADMIN",
         platformKey: "tk_admin_system_key",
         points: 999999,
         showOnLeaderboard: false
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
    console.log(`邀请码已生成: ${code}`);
  } else {
    console.log(`邀请码已存在。`);
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
