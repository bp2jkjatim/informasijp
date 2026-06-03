import "server-only";

import { prisma } from "@/lib/prisma";

type TrainingFilters = {
  employeeId?: number;
  year?: number;
  take?: number;
};

function buildTrainingWhere(filters: TrainingFilters = {}) {
  return {
    ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    ...(filters.year ? { year: filters.year } : {}),
  };
}

function serializeTrainingRecord<T extends { jumlahJp: { toString(): string } }>(record: T) {
  return {
    ...record,
    jumlahJp: Number(record.jumlahJp),
  };
}

export async function getAdminTrainingRecords(filters: TrainingFilters = {}) {
  const records = await prisma.training.findMany({
    where: buildTrainingWhere(filters),
    orderBy: {
      createdAt: "desc",
    },
    ...(filters.take ? { take: filters.take } : {}),
    include: {
      employee: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      createdByUser: {
        select: {
          username: true,
        },
      },
    },
  });

  return records.map(serializeTrainingRecord);
}

export async function getEmployeeTrainingRecords(employeeId: number, filters: Omit<TrainingFilters, "employeeId"> = {}) {
  const records = await prisma.training.findMany({
    where: buildTrainingWhere({
      employeeId,
      year: filters.year,
    }),
    orderBy: {
      createdAt: "desc",
    },
    ...(filters.take ? { take: filters.take } : {}),
    include: {
      employee: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      createdByUser: {
        select: {
          username: true,
        },
      },
    },
  });

  return records.map(serializeTrainingRecord);
}

export async function getTrainingYears(employeeId?: number) {
  const years = await prisma.training.findMany({
    where: employeeId ? { employeeId } : undefined,
    distinct: ["year"],
    select: {
      year: true,
    },
    orderBy: {
      year: "desc",
    },
  });

  return years.map((item) => item.year);
}

export async function getTrainingExportRecords(filters: TrainingFilters = {}) {
  const records = await prisma.training.findMany({
    where: buildTrainingWhere(filters),
    orderBy: [
      {
        year: "desc",
      },
      {
        employee: {
          name: "asc",
        },
      },
      {
        trainingName: "asc",
      },
    ],
    include: {
      employee: {
        select: {
          nip: true,
          name: true,
          jobTitle: true,
        },
      },
      createdByUser: {
        select: {
          username: true,
        },
      },
    },
  });

  return records.map(serializeTrainingRecord);
}

export async function getTrainingById(trainingId: number) {
  return prisma.training.findUnique({
    where: { id: trainingId },
    include: {
      employee: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
    },
  });
}
