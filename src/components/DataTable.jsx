import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'

export function DataTable({
  data,
  columns,
  emptyMessage = 'Belum ada data.',
  onRowClick,
  selectedRowId,
}) {
  const [sorting, setSorting] = useState([])
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="scroll-area">
      <Table>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeaderCell
                  key={header.id}
                  className={header.column.getCanSort() ? 'cursor-pointer select-none whitespace-nowrap border-b border-blue-100 bg-white py-3 text-[11px] uppercase tracking-wide text-blue-900/45' : 'whitespace-nowrap border-b border-blue-100 bg-white py-3 text-[11px] uppercase tracking-wide text-blue-900/45'}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted()] ?? ''}
                    </span>
                  )}
                </TableHeaderCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-sm text-blue-900/50">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={
                  onRowClick
                    ? `cursor-pointer ${selectedRowId === row.original.employee_id || selectedRowId === row.original.id ? 'bg-blue-50' : 'hover:bg-blue-50/60'}`
                    : ''
                }
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="border-b border-blue-100 py-3 align-top text-sm text-blue-950/82">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
