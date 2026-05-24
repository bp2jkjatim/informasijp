import { useMemo, useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { Card, Grid, Text, TextInput, Title } from '@tremor/react'
import { apiFetch, criteriaLabel } from '../api'
import { DataTable } from '../components/DataTable'

const employeeColumnHelper = createColumnHelper()

export function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [search, setSearch] = useState('')

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch('/api/dashboard'),
  })

  const employees = dashboardQuery.data?.employees || []

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return employees
    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(term) || employee.nip.toLowerCase().includes(term),
    )
  }, [employees, search])

  const employeeColumns = useMemo(
    () => [
      employeeColumnHelper.accessor('name', {
        header: 'Nama',
        cell: ({ row }) => <div className="font-medium text-blue-950">{row.original.name}</div>,
      }),
      employeeColumnHelper.accessor('nip', { header: 'NIP' }),
      employeeColumnHelper.accessor('total_jp', { header: 'Total JP' }),
      employeeColumnHelper.accessor('jp_target', { header: 'Target' }),
      employeeColumnHelper.display({
        id: 'criteria',
        header: 'Kriteria',
        cell: ({ row }) => <span className="text-xs text-blue-900/60">{criteriaLabel(row.original)}</span>,
      }),
      employeeColumnHelper.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`status-badge ${row.original.overall_completed ? 'status-badge-low' : 'status-badge-high'}`}>
            {row.original.overall_completed ? 'Lengkap' : 'Belum'}
          </span>
        ),
      }),
    ],
    [],
  )

  return (
    <Grid numItemsLg={12} className="gap-3">
      <Card className="panel-card lg:col-span-9 rounded-md p-5">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Text className="!text-blue-900/45">Data Pegawai</Text>
            <Title className="!text-xl !text-blue-950">Daftar Pegawai</Title>
          </div>
          <div className="w-full max-w-sm">
            <TextInput className="dense-input" placeholder="Cari nama atau NIP" value={search} onValueChange={setSearch} />
          </div>
        </div>
        <DataTable
          data={filteredEmployees}
          columns={employeeColumns}
          emptyMessage="Belum ada data pegawai."
          onRowClick={setSelectedEmployee}
          selectedRowId={selectedEmployee?.employee_id}
        />
      </Card>

      <Card className="panel-card lg:col-span-3 rounded-md p-5">
        <Text className="!text-blue-900/45">Detail Pegawai</Text>
        {selectedEmployee ? (
          <div className="mt-3 space-y-3">
            <div>
              <Title className="!text-xl !text-blue-950">{selectedEmployee.name}</Title>
              <Text className="!text-blue-900/50">{selectedEmployee.nip}</Text>
            </div>
            <DetailItem label="Total JP" value={selectedEmployee.total_jp} />
            <DetailItem label="Target JP" value={selectedEmployee.jp_target} />
            <DetailItem label="Kriteria" value={criteriaLabel(selectedEmployee)} />
            <DetailItem label="Status JP" value={selectedEmployee.jp_fulfilled ? 'Memenuhi' : 'Belum'} />
            <DetailItem label="Overall" value={selectedEmployee.overall_completed ? 'Lengkap' : 'Belum'} />
          </div>
        ) : (
          <Text className="!mt-3 !text-blue-900/55">Klik salah satu baris tabel untuk melihat detail singkat.</Text>
        )}
      </Card>
    </Grid>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-md border border-blue-100 bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-blue-900/45">{label}</div>
      <div className="mt-1 text-sm font-semibold text-blue-950">{value}</div>
    </div>
  )
}
