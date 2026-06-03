import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { employeeSeeds } from "./seed-data.mjs";

const prisma = new PrismaClient();

function isNumericIdentifier(value) {
  return /^\d+$/.test(value);
}

function makeEmployeeNip(seed) {
  if (seed.nip === "Outsourcing") {
    return `${seed.nip}-${seed.username}`;
  }

  return seed.nip;
}

function makeUsername(seed) {
  if (seed.username) {
    return seed.username;
  }

  return seed.nip;
}

function makePasswordSource(seed, username) {
  if (isNumericIdentifier(seed.nip)) {
    return seed.nip;
  }

  if (seed.nip !== "Outsourcing") {
    return seed.nip;
  }

  return username;
}

function makeRole(seed) {
  return seed.initialRole === "admin" ? UserRole.admin : UserRole.user;
}

async function main() {
  for (const seed of employeeSeeds) {
    const employeeNip = makeEmployeeNip(seed);
    const username = makeUsername(seed);
    const passwordSource = makePasswordSource(seed, username);
    const passwordHash = await bcrypt.hash(passwordSource, 10);

    const employee = await prisma.employee.upsert({
      where: { nip: employeeNip },
      update: {
        name: seed.name,
        jobTitle: seed.jobTitle,
        phone: seed.phone,
        employmentState: seed.employmentState,
      },
      create: {
        nip: employeeNip,
        name: seed.name,
        jobTitle: seed.jobTitle,
        phone: seed.phone,
        employmentState: seed.employmentState,
      },
    });

    await prisma.user.upsert({
      where: { username },
      update: {
        employeeId: employee.id,
        role: makeRole(seed),
        isActive: seed.employmentState === "aktif",
        passwordHash,
      },
      create: {
        username,
        passwordHash,
        role: makeRole(seed),
        employeeId: employee.id,
        isActive: seed.employmentState === "aktif",
      },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "jp_target_pns" },
    update: { value: "20" },
    create: { key: "jp_target_pns", value: "20" },
  });

  await prisma.systemSetting.upsert({
    where: { key: "seed_user_login_rule" },
    update: { value: "username=nip,password=nip,outsourcing_uses_alias" },
    create: {
      key: "seed_user_login_rule",
      value: "username=nip,password=nip,outsourcing_uses_alias",
    },
  });

  console.log(`Seeded ${employeeSeeds.length} employee records and bootstrap users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
