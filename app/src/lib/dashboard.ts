import "server-only";

import { prisma } from "@/lib/prisma";

function sumTrainingCategoryJp(
  trainings: Array<{
    jumlahJp: { toString(): string };
    isPbj: boolean;
    isJabatan: boolean;
    isIntegritas: boolean;
  }>,
) {
  return trainings.reduce(
    (accumulator, training) => {
      const jp = Number(training.jumlahJp);

      if (training.isPbj) {
        accumulator.pbjJp += jp;
      }

      if (training.isJabatan) {
        accumulator.jabatanJp += jp;
      }

      if (training.isIntegritas) {
        accumulator.integritasJp += jp;
      }

      return accumulator;
    },
    {
      pbjJp: 0,
      jabatanJp: 0,
      integritasJp: 0,
    },
  );
}

export async function getAdminDashboardSummary() {
  const now = new Date();
  const activePeriodMonth = now.getMonth() + 1;
  const activePeriodYear = now.getFullYear();
  const [
    totalEmployees,
    totalUsers,
    totalAdmins,
    totalTrainings,
    totalSupportingDocuments,
    employeeStatusCounts,
    employmentStateCounts,
    employeesWithSupportingDocumentsThisPeriod,
    topTrainingJpEmployeesRaw,
    pendingSupportPeriodsRaw,
    employeeCategoryRows,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.training.count(),
    prisma.supportingDocument.count(),
    prisma.employee.groupBy({
      by: ["employeeStatus"],
      _count: {
        _all: true,
      },
    }),
    prisma.employee.groupBy({
      by: ["employmentState"],
      _count: {
        _all: true,
      },
    }),
    prisma.supportingDocument.findMany({
      where: {
        periodMonth: activePeriodMonth,
        periodYear: activePeriodYear,
      },
      distinct: ["employeeId"],
      select: {
        employeeId: true,
      },
    }),
    prisma.training.groupBy({
      by: ["employeeId"],
      _sum: {
        jumlahJp: true,
      },
      orderBy: {
        _sum: {
          jumlahJp: "desc",
        },
      },
      take: 8,
    }),
    prisma.supportingDocument.groupBy({
      by: ["employeeId", "periodYear", "periodMonth"],
      _count: {
        _all: true,
      },
      orderBy: [
        { periodYear: "desc" },
        { periodMonth: "desc" },
      ],
      take: 12,
    }),
    prisma.employee.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        nip: true,
        name: true,
        jobTitle: true,
        trainings: {
          select: {
            jumlahJp: true,
            isPbj: true,
            isJabatan: true,
            isIntegritas: true,
          },
        },
      },
    }),
  ]);

  const employeesWithoutSupportingDocumentsThisPeriod = await prisma.employee.findMany({
    where: {
      id: {
        notIn: employeesWithSupportingDocumentsThisPeriod.map((item) => item.employeeId),
      },
    },
    orderBy: {
      name: "asc",
    },
    take: 10,
    select: {
      id: true,
      nip: true,
      name: true,
      jobTitle: true,
    },
  });

  const pendingSupportPeriods = pendingSupportPeriodsRaw.filter((period) => {
    return !period.periodMonth || !period.periodYear
      ? false
      : true;
  });
  const supportPeriodReviews = pendingSupportPeriods.length
    ? await prisma.supportingDocumentPeriodReview.findMany({
        where: {
          OR: pendingSupportPeriods.map((period) => ({
            employeeId: period.employeeId,
            periodMonth: period.periodMonth,
            periodYear: period.periodYear,
          })),
        },
        select: {
          employeeId: true,
          periodMonth: true,
          periodYear: true,
        },
      })
    : [];
  const reviewedPeriodKeys = new Set(
    supportPeriodReviews.map((review) => `${review.employeeId}-${review.periodYear}-${review.periodMonth}`),
  );
  const unresolvedPeriods = pendingSupportPeriods.filter(
    (period) => !reviewedPeriodKeys.has(`${period.employeeId}-${period.periodYear}-${period.periodMonth}`),
  );
  const unresolvedPeriodDetails = unresolvedPeriods.slice(0, 8);

  const [topTrainingEmployees, unresolvedPeriodEmployees] = await Promise.all([
    prisma.employee.findMany({
      where: {
        id: {
          in: topTrainingJpEmployeesRaw.map((item) => item.employeeId),
        },
      },
      select: {
        id: true,
        nip: true,
        name: true,
        jobTitle: true,
      },
    }),
    prisma.employee.findMany({
      where: {
        id: {
          in: unresolvedPeriodDetails.map((item) => item.employeeId),
        },
      },
      select: {
        id: true,
        nip: true,
        name: true,
      },
    }),
  ]);

  const employeeMap = new Map(topTrainingEmployees.map((employee) => [employee.id, employee]));
  const unresolvedEmployeeMap = new Map(
    unresolvedPeriodEmployees.map((employee) => [employee.id, employee]),
  );

  const topTrainingJpEmployees = topTrainingJpEmployeesRaw.map((item) => ({
    employeeId: item.employeeId,
    totalJp: Number(item._sum.jumlahJp ?? 0),
    employee: employeeMap.get(item.employeeId) ?? null,
  }));

  const pendingSupportPeriodsSummary = unresolvedPeriodDetails.map((item) => ({
    employeeId: item.employeeId,
    periodMonth: item.periodMonth,
    periodYear: item.periodYear,
    documentsCount: item._count._all,
    employee: unresolvedEmployeeMap.get(item.employeeId) ?? null,
  }));
  const employeeCategoryProgress = employeeCategoryRows
    .map((employee) => {
      const categoryJp = sumTrainingCategoryJp(employee.trainings);
      const missingCategories = [
        categoryJp.pbjJp <= 0 ? "PBJ" : null,
        categoryJp.jabatanJp <= 0 ? "Jabatan" : null,
        categoryJp.integritasJp <= 0 ? "Integritas" : null,
      ].filter(Boolean) as string[];

      return {
        id: employee.id,
        nip: employee.nip,
        name: employee.name,
        jobTitle: employee.jobTitle,
        pbjJp: categoryJp.pbjJp,
        jabatanJp: categoryJp.jabatanJp,
        integritasJp: categoryJp.integritasJp,
        missingCategories,
      };
    })
    .filter((employee) => employee.missingCategories.length)
    .sort((left, right) => right.missingCategories.length - left.missingCategories.length)
    .slice(0, 10);

  return {
    activePeriodMonth,
    activePeriodYear,
    totalEmployees,
    totalUsers,
    totalAdmins,
    totalTrainings,
    totalSupportingDocuments,
    employeeStatusCounts,
    employmentStateCounts,
    supportingDocumentsUploadedThisPeriod: employeesWithSupportingDocumentsThisPeriod.length,
    employeesWithoutSupportingDocumentsThisPeriod,
    pendingSupportPeriodCount: unresolvedPeriods.length,
    topTrainingJpEmployees,
    pendingSupportPeriods: pendingSupportPeriodsSummary,
    employeeCategoryProgress,
  };
}

export async function getEmployeeDashboardSummary(employeeId: number) {
  const now = new Date();
  const activePeriodMonth = now.getMonth() + 1;
  const activePeriodYear = now.getFullYear();
  const [employee, trainingCount, aggregate, latestTrainings, activePeriodDocuments, latestReview, categoryTrainings] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        jpTarget: true,
      },
    }),
    prisma.training.count({
      where: { employeeId },
    }),
    prisma.training.aggregate({
      where: { employeeId },
      _sum: {
        jumlahJp: true,
      },
    }),
    prisma.training.findMany({
      where: { employeeId },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        trainingName: true,
        trainingProvider: true,
        jumlahJp: true,
        year: true,
      },
    }),
    prisma.supportingDocument.findMany({
      where: {
        employeeId,
        periodMonth: activePeriodMonth,
        periodYear: activePeriodYear,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        fileOriginalName: true,
        description: true,
      },
    }),
    prisma.supportingDocumentPeriodReview.findFirst({
      where: { employeeId },
      orderBy: [
        { periodYear: "desc" },
        { periodMonth: "desc" },
        { reviewedAt: "desc" },
      ],
      include: {
        reviewedByUser: {
          select: {
            username: true,
            employee: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.training.findMany({
      where: { employeeId },
      select: {
        jumlahJp: true,
        isPbj: true,
        isJabatan: true,
        isIntegritas: true,
      },
    }),
  ]);

  const jpTarget = employee?.jpTarget ?? 20;
  const categoryJp = sumTrainingCategoryJp(categoryTrainings);
  const pbjStatus: "fulfilled" | "missing" = categoryJp.pbjJp > 0 ? "fulfilled" : "missing";
  const jabatanStatus: "fulfilled" | "missing" =
    categoryJp.jabatanJp > 0 ? "fulfilled" : "missing";
  const integritasStatus: "fulfilled" | "missing" =
    categoryJp.integritasJp > 0 ? "fulfilled" : "missing";
  const activePeriodSupportStatus: "reviewed" | "uploaded" | "missing" =
    latestReview && latestReview.periodMonth === activePeriodMonth && latestReview.periodYear === activePeriodYear
      ? "reviewed"
      : activePeriodDocuments.length
        ? "uploaded"
        : "missing";
  const serializedLatestTrainings = latestTrainings.map((training) => ({
    ...training,
    jumlahJp: Number(training.jumlahJp),
  }));

  return {
    activePeriodMonth,
    activePeriodYear,
    jpTarget,
    trainingCount,
    totalJp: Number(aggregate._sum.jumlahJp ?? 0),
    latestTrainings: serializedLatestTrainings,
    pbjJp: categoryJp.pbjJp,
    jabatanJp: categoryJp.jabatanJp,
    integritasJp: categoryJp.integritasJp,
    pbjStatus,
    jabatanStatus,
    integritasStatus,
    activePeriodSupportingDocumentsCount: activePeriodDocuments.length,
    activePeriodSupportingDocuments: activePeriodDocuments,
    activePeriodSupportStatus,
    latestSupportReview: latestReview
      ? {
          periodMonth: latestReview.periodMonth,
          periodYear: latestReview.periodYear,
          comment: latestReview.comment,
          reviewedAt: latestReview.reviewedAt,
          reviewedByLabel: latestReview.reviewedByUser
            ? latestReview.reviewedByUser.employee?.name
              ? `${latestReview.reviewedByUser.employee.name} (${latestReview.reviewedByUser.username})`
              : latestReview.reviewedByUser.username
            : null,
        }
      : null,
  };
}
