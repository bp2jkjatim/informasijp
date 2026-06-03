import "server-only";

import { prisma } from "@/lib/prisma";

type SupportingDocumentFilters = {
  employeeId?: number;
  periodMonth?: number;
  periodYear?: number;
};

type SupportingDocumentReviewLookup = {
  comment: string | null;
  reviewedAt: Date | null;
  reviewedByLabel: string | null;
};

type SupportingDocumentPeriodSummary = {
  periodMonth: number;
  periodYear: number;
  documentsCount: number;
  reviewComment: string | null;
  reviewedAt: Date | null;
  reviewedByLabel: string | null;
  reviewStatus: "reviewed" | "pending";
};

export function getPeriodLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function isPreviewableMimeType(mimeType: string | null) {
  if (!mimeType) {
    return false;
  }

  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

function getPeriodKey(periodMonth: number, periodYear: number) {
  return `${periodYear}-${periodMonth}`;
}

function mapReviewLookup(
  reviews: Array<{
    periodMonth: number;
    periodYear: number;
    comment: string | null;
    reviewedAt: Date | null;
    reviewedByUser: { username: string; employee: { name: string } | null } | null;
  }>,
) {
  return new Map<string, SupportingDocumentReviewLookup>(
    reviews.map((review) => [
      getPeriodKey(review.periodMonth, review.periodYear),
      {
        comment: review.comment,
        reviewedAt: review.reviewedAt,
        reviewedByLabel: review.reviewedByUser
          ? review.reviewedByUser.employee?.name
            ? `${review.reviewedByUser.employee.name} (${review.reviewedByUser.username})`
            : review.reviewedByUser.username
          : null,
      },
    ]),
  );
}

export async function getEmployeeSupportingDocuments(
  employeeId: number,
  filters: SupportingDocumentFilters = {},
) {
  const where = {
    employeeId,
    ...(filters.periodMonth ? { periodMonth: filters.periodMonth } : {}),
    ...(filters.periodYear ? { periodYear: filters.periodYear } : {}),
  };

  const [documents, reviews] = await Promise.all([
    prisma.supportingDocument.findMany({
      where,
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
    }),
    prisma.supportingDocumentPeriodReview.findMany({
      where: {
        employeeId,
        ...(filters.periodMonth ? { periodMonth: filters.periodMonth } : {}),
        ...(filters.periodYear ? { periodYear: filters.periodYear } : {}),
      },
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
  ]);

  const reviewLookup = mapReviewLookup(reviews);

  return documents.map((document) => {
    const review = reviewLookup.get(getPeriodKey(document.periodMonth, document.periodYear));
    const reviewStatus: "reviewed" | "pending" = review ? "reviewed" : "pending";

    return {
      ...document,
      reviewComment: review?.comment ?? null,
      reviewedAt: review?.reviewedAt ?? null,
      reviewedByLabel: review?.reviewedByLabel ?? null,
      reviewStatus,
    };
  });
}

export async function getEmployeeSupportingDocumentPeriods(employeeId: number) {
  const [periods, reviews, counts] = await Promise.all([
    prisma.supportingDocument.findMany({
      where: { employeeId },
      distinct: ["periodYear", "periodMonth"],
      select: {
        periodYear: true,
        periodMonth: true,
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.supportingDocumentPeriodReview.findMany({
      where: { employeeId },
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
    prisma.supportingDocument.groupBy({
      by: ["periodYear", "periodMonth"],
      where: { employeeId },
      _count: {
        _all: true,
      },
    }),
  ]);

  const reviewLookup = mapReviewLookup(reviews);
  const countLookup = new Map<string, number>(
    counts.map((count) => [
      getPeriodKey(count.periodMonth, count.periodYear),
      count._count._all,
    ]),
  );

  return periods.map<SupportingDocumentPeriodSummary>((period) => {
    const periodKey = getPeriodKey(period.periodMonth, period.periodYear);
    const review = reviewLookup.get(periodKey);
    const reviewStatus: "reviewed" | "pending" = review ? "reviewed" : "pending";

    return {
      periodMonth: period.periodMonth,
      periodYear: period.periodYear,
      documentsCount: countLookup.get(periodKey) ?? 0,
      reviewComment: review?.comment ?? null,
      reviewedAt: review?.reviewedAt ?? null,
      reviewedByLabel: review?.reviewedByLabel ?? null,
      reviewStatus,
    };
  });
}

export async function getAdminSupportingDocumentPeriodSummaries() {
  const [periods, reviews, counts] = await Promise.all([
    prisma.supportingDocument.findMany({
      distinct: ["employeeId", "periodYear", "periodMonth"],
      select: {
        employeeId: true,
        periodYear: true,
        periodMonth: true,
        employee: {
          select: {
            name: true,
            nip: true,
          },
        },
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.supportingDocumentPeriodReview.findMany({
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
    prisma.supportingDocument.groupBy({
      by: ["employeeId", "periodYear", "periodMonth"],
      _count: {
        _all: true,
      },
    }),
  ]);

  const reviewLookup = new Map(
    reviews.map((review) => [
      `${review.employeeId}-${getPeriodKey(review.periodMonth, review.periodYear)}`,
      review,
    ]),
  );
  const countLookup = new Map(
    counts.map((count) => [
      `${count.employeeId}-${getPeriodKey(count.periodMonth, count.periodYear)}`,
      count._count._all,
    ]),
  );

  return periods.map((period) => {
    const summaryKey = `${period.employeeId}-${getPeriodKey(period.periodMonth, period.periodYear)}`;
    const review = reviewLookup.get(summaryKey);
    const reviewStatus: "reviewed" | "pending" = review ? "reviewed" : "pending";

    return {
      employeeId: period.employeeId,
      periodMonth: period.periodMonth,
      periodYear: period.periodYear,
      documentsCount: countLookup.get(summaryKey) ?? 0,
      reviewComment: review?.comment ?? null,
      reviewedAt: review?.reviewedAt ?? null,
      reviewedByLabel: review?.reviewedByUser
        ? review.reviewedByUser.employee?.name
          ? `${review.reviewedByUser.employee.name} (${review.reviewedByUser.username})`
          : review.reviewedByUser.username
        : null,
      reviewStatus,
      employee: period.employee,
    };
  });
}

export async function getSupportingDocumentPeriods() {
  return prisma.supportingDocument.findMany({
    distinct: ["employeeId", "periodYear", "periodMonth"],
    select: {
      employeeId: true,
      periodYear: true,
      periodMonth: true,
      employee: {
        select: {
          name: true,
          nip: true,
        },
      },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
  });
}

export async function getSupportingDocumentsByPeriod(employeeId: number, periodMonth: number, periodYear: number) {
  const [documents, review] = await Promise.all([
    prisma.supportingDocument.findMany({
      where: { employeeId, periodMonth, periodYear },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            nip: true,
          },
        },
      },
    }),
    prisma.supportingDocumentPeriodReview.findUnique({
      where: {
        employeeId_periodYear_periodMonth: {
          employeeId,
          periodYear,
          periodMonth,
        },
      },
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
  ]);

  const mappedDocuments = documents.map((document) => {
    const reviewStatus: "reviewed" | "pending" = review ? "reviewed" : "pending";

    return {
      ...document,
      reviewComment: review?.comment ?? null,
      reviewedAt: review?.reviewedAt ?? null,
      reviewedByLabel: review?.reviewedByUser
        ? review.reviewedByUser.employee?.name
          ? `${review.reviewedByUser.employee.name} (${review.reviewedByUser.username})`
          : review.reviewedByUser.username
        : null,
      reviewStatus,
    };
  });

  return { documents: mappedDocuments, review };
}

export async function getSupportingDocumentExportRecords(filters: SupportingDocumentFilters = {}) {
  const where = {
    ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    ...(filters.periodMonth ? { periodMonth: filters.periodMonth } : {}),
    ...(filters.periodYear ? { periodYear: filters.periodYear } : {}),
  };

  const [documents, reviews] = await Promise.all([
    prisma.supportingDocument.findMany({
      where,
      orderBy: [
        { periodYear: "desc" },
        { periodMonth: "desc" },
        { employee: { name: "asc" } },
        { createdAt: "desc" },
      ],
      include: {
        employee: {
          select: {
            id: true,
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
    }),
    prisma.supportingDocumentPeriodReview.findMany({
      where,
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
  ]);

  const reviewLookup = new Map(
    reviews.map((review) => [
      `${review.employeeId}-${getPeriodKey(review.periodMonth, review.periodYear)}`,
      review,
    ]),
  );

  return documents.map((document) => {
    const review = reviewLookup.get(
      `${document.employeeId}-${getPeriodKey(document.periodMonth, document.periodYear)}`,
    );

    return {
      ...document,
      reviewComment: review?.comment ?? null,
      reviewedAt: review?.reviewedAt ?? null,
      reviewedByLabel: review?.reviewedByUser
        ? review.reviewedByUser.employee?.name
          ? `${review.reviewedByUser.employee.name} (${review.reviewedByUser.username})`
          : review.reviewedByUser.username
        : null,
      reviewStatus: (review ? "reviewed" : "pending") as "reviewed" | "pending",
    };
  });
}
