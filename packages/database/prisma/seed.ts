import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'awolf@fund-manager.app' },
    update: { systemRole: 'SUPER_ADMIN', name: 'Awolf' },
    create: { email: 'awolf@fund-manager.app', name: 'Awolf', systemRole: 'SUPER_ADMIN' },
  });

  // 2. Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@fund-manager.app' },
    update: { name: 'Rahim Khan' },
    create: { email: 'manager@fund-manager.app', name: 'Rahim Khan', phone: '+8801711000001', bkashNumber: '01711000001' },
  });

  // 3. Members
  const member1 = await prisma.user.upsert({
    where: { email: 'karim@fund-manager.app' },
    update: { name: 'Karim Ahmed' },
    create: { email: 'karim@fund-manager.app', name: 'Karim Ahmed', phone: '+8801711000002', bkashNumber: '01711000002' },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'fatima@fund-manager.app' },
    update: { name: 'Fatima Begum' },
    create: { email: 'fatima@fund-manager.app', name: 'Fatima Begum', phone: '+8801711000003', bkashNumber: '01711000003' },
  });

  const member3 = await prisma.user.upsert({
    where: { email: 'nasir@fund-manager.app' },
    update: { name: 'Nasir Uddin' },
    create: { email: 'nasir@fund-manager.app', name: 'Nasir Uddin', phone: '+8801711000004', bkashNumber: '01711000004' },
  });

  // Create a sample group
  let group = await prisma.group.findFirst({ where: { name: 'Bro Fund 2026' } });
  if (!group) {
    group = await prisma.group.create({
      data: {
        name: 'Bro Fund 2026',
        description: 'Monthly savings with the squad',
        monthlyAmount: 1000,
        fineAmount: 100,
        fineDeadlineDay: 15,
      },
    });
  }

  // Assign manager to group
  await prisma.membership.upsert({
    where: { userId_groupId: { userId: manager.id, groupId: group.id } },
    update: { role: 'MANAGER', status: 'ACTIVE' },
    create: { userId: manager.id, groupId: group.id, role: 'MANAGER' },
  });

  // Add members
  for (const member of [member1, member2, member3]) {
    await prisma.membership.upsert({
      where: { userId_groupId: { userId: member.id, groupId: group.id } },
      update: { role: 'MEMBER', status: 'ACTIVE' },
      create: { userId: member.id, groupId: group.id, role: 'MEMBER' },
    });
  }

  console.log('');
  console.log('=== Test Accounts Created ===');
  console.log('OTP for all accounts: 000000 (staging)');
  console.log('');
  console.log('┌─────────────────┬────────────────────────────┬──────────────┐');
  console.log('│ Role            │ Email                      │ Name         │');
  console.log('├─────────────────┼────────────────────────────┼──────────────┤');
  console.log('│ Super Admin     │ awolf@fund-manager.app     │ Awolf        │');
  console.log('│ Manager         │ manager@fund-manager.app   │ Rahim Khan   │');
  console.log('│ Member          │ karim@fund-manager.app     │ Karim Ahmed  │');
  console.log('│ Member          │ fatima@fund-manager.app    │ Fatima Begum │');
  console.log('│ Member          │ nasir@fund-manager.app     │ Nasir Uddin  │');
  console.log('└─────────────────┴────────────────────────────┴──────────────┘');
  console.log('');
  console.log(`Group: "${group.name}" (ID: ${group.id})`);
  console.log(`  Manager: ${manager.name}`);
  console.log(`  Members: ${member1.name}, ${member2.name}, ${member3.name}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
