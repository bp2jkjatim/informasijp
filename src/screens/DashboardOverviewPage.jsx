import { AreaChart, Card, Grid, ProgressBar, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from '@tremor/react'
import { useQuery } from '@tanstack/react-query'
import { RiAddLine, RiCalendarLine } from '@remixicon/react'
import { apiFetch } from '../api'
import { useSessionUser } from '../hooks/useSessionUser'

const OVERVIEW_CHART = [
  { date: '16/04/2024', rowsRead: 620000, rowsWritten: 85000 },
  { date: '20/04/2024', rowsRead: 612000, rowsWritten: 79000 },
  { date: '24/04/2024', rowsRead: 605000, rowsWritten: 81000 },
  { date: '28/04/2024', rowsRead: 618000, rowsWritten: 86000 },
  { date: '02/05/2024', rowsRead: 624000, rowsWritten: 83000 },
  { date: '06/05/2024', rowsRead: 638000, rowsWritten: 82000 },
  { date: '10/05/2024', rowsRead: 651000, rowsWritten: 79000 },
  { date: '16/05/2024', rowsRead: 643015, rowsWritten: 83197 },
]

export function DashboardOverviewPage() {
  const authQuery = useSessionUser()
  const user = authQuery.data?.user

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch('/api/dashboard'),
    enabled: Boolean(user),
  })

  const dashboard = dashboardQuery.data
  const employees = (dashboard?.employees || []).slice(0, 6)
  const summary = dashboard?.summary || {}

  return (
    <section className="grid gap-3">
      <Card className="panel-card rounded-md border-blue-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-blue-100 pb-6">
          <div>
            <Title className="!text-[22px] !font-semibold !tracking-tight !text-blue-950">Current billing cycle</Title>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm">
            Tambah Data
            <RiAddLine size={18} />
          </button>
        </div>

        <Grid numItemsLg={2} className="mt-6 gap-7">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Text className="!font-medium !text-blue-950">Usage</Text>
                <span className="soft-badge soft-badge-neutral">+0.2%</span>
              </div>
              <div className="mt-1 text-[36px] font-semibold tracking-tight text-blue-950">
                68.1% <span className="text-base font-normal text-blue-900/50">of allowed capacity</span>
              </div>
            </div>
            <UsageLine label="Rows read" value="48.1/100M" progress={48.1} />
            <UsageLine label="Rows written" value="78.3/100M" progress={78.3} />
            <UsageLine label="Storage" value="5.2/20GB" progress={26} />
            <Text className="!text-sm !text-blue-900/55">Monthly usage resets in 12 days. <span className="font-medium text-blue-900">Manage plan.</span></Text>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Text className="!font-medium !text-blue-950">Workspace</Text>
                <span className="soft-badge soft-badge-neutral">+2.9%</span>
              </div>
              <div className="mt-1 text-[36px] font-semibold tracking-tight text-blue-950">
                21.7% <span className="text-base font-normal text-blue-900/50">weekly active users</span>
              </div>
            </div>
            <UsageLine label="Weekly active users" value="21.7/100" progress={21.7} />
            <UsageLine label="Total users" value={`${summary.total_employees || 56}/100`} progress={56} />
            <UsageLine label="Uptime" value="99.9%" progress={99.9} />
            <Text className="!text-sm !text-blue-900/55">With free plan, up to 20 members can be invited.</Text>
          </div>
        </Grid>
      </Card>

      <Card className="panel-card rounded-md border-blue-100 bg-white px-5 py-5 shadow-sm">
        <div className="mb-6">
          <Title className="!text-[22px] !font-semibold !tracking-tight !text-blue-950">Overview</Title>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-blue-950/80">
              <RiCalendarLine size={16} />
              16 Apr, 2024 - 16 May, 2024
            </button>
            <button type="button" className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-blue-950/80">
              Last year
            </button>
          </div>
        </div>

        <Grid numItemsLg={2} className="gap-4">
          <Card className="rounded-md border border-blue-100 bg-white p-4 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Text className="!font-medium !text-blue-950">Rows read</Text>
                  <span className="soft-badge soft-badge-positive">+4.4%</span>
                </div>
                <div className="mt-1 text-[36px] font-semibold tracking-tight text-blue-950">643,015</div>
              </div>
              <Text className="!text-blue-900/50">from 615,752</Text>
            </div>
            <AreaChart
              className="mt-4 h-44"
              data={OVERVIEW_CHART}
              index="date"
              categories={['rowsRead']}
              colors={['blue']}
              showLegend={false}
              showGridLines={false}
              showYAxis={false}
              startEndOnly={true}
            />
          </Card>

          <Card className="rounded-md border border-blue-100 bg-white p-4 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Text className="!font-medium !text-blue-950">Rows written</Text>
                  <span className="soft-badge soft-badge-negative">-3.9%</span>
                </div>
                <div className="mt-1 text-[36px] font-semibold tracking-tight text-blue-950">83,197</div>
              </div>
              <Text className="!text-blue-900/50">from 86,541</Text>
            </div>
            <AreaChart
              className="mt-4 h-44"
              data={OVERVIEW_CHART}
              index="date"
              categories={['rowsWritten']}
              colors={['blue']}
              showLegend={false}
              showGridLines={false}
              showYAxis={false}
              startEndOnly={true}
            />
          </Card>
        </Grid>
      </Card>

      <Card className="panel-card rounded-md border-blue-100 bg-white px-5 py-4 shadow-sm">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Created at</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Policy Info</TableHeaderCell>
              <TableHeaderCell>Contact Type</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Assessed Priority</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee, index) => (
              <TableRow key={employee.employee_id || index}>
                <TableCell className="py-4 text-sm text-blue-900/50">31/10/2024, 13:{String(44 - index * 5).padStart(2, '0')}</TableCell>
                <TableCell className="font-medium text-blue-950">
                  {index % 2 === 0 ? 'Fraudulent policy report' : 'Agent conduct complaint'}
                </TableCell>
                <TableCell className="text-blue-900/70">BIZ-{String(employee.employee_id).padStart(8, '0')}</TableCell>
                <TableCell className="text-blue-900/70">{index % 2 === 0 ? 'Billing' : 'Coverage'}</TableCell>
                <TableCell className="text-blue-900/70">{20 + index * 10}m</TableCell>
                <TableCell>
                  <span className={`status-badge ${
                    index % 3 === 0 ? 'status-badge-high' : index % 3 === 1 ? 'status-badge-low' : 'status-badge-medium'
                  }`}>
                    {index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Low' : 'Medium'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  )
}

function UsageLine({ label, value, progress }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-blue-950/80">{label}</span>
        <span className="text-blue-900/50">{value}</span>
      </div>
      <ProgressBar value={progress} color="blue" />
    </div>
  )
}
