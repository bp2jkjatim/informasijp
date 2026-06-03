"use client";

import { useMemo, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

type TablePaginationProps<T> = {
  items: T[];
  pageSize?: number;
};

export function useTablePagination<T>({
  items,
  pageSize = 10,
}: TablePaginationProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize]);

  function goToPreviousPage() {
    setPage((value) => Math.max(1, value - 1));
  }

  function goToNextPage() {
    setPage((value) => Math.min(totalPages, value + 1));
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    hasPagination: items.length > pageSize,
    goToPreviousPage,
    goToNextPage,
  };
}

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-300 pt-4">
      <div className="text-sm text-slate-600">
        Halaman {currentPage} dari {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RiArrowLeftSLine size={18} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RiArrowRightSLine size={18} />
        </button>
      </div>
    </div>
  );
}
