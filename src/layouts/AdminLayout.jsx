import { useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Button, Card, Text, Title } from '@tremor/react'
import { RiBarChartHorizontalLine, RiFileList3Line, RiMenuLine, RiSettings3Line, RiUserAddLine, RiUserLine } from '@remixicon/react'
import { apiFetch } from '../api'
import { useSessionUser } from '../hooks/useSessionUser'

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: RiBarChartHorizontalLine },
  { to: '/app/diklat', label: 'Diklat', icon: RiFileList3Line },
  { to: '/app/pegawai', label: 'Pegawai', icon: RiSettings3Line },
]

const SHORTCUTS = [
  { label: 'Tambah pegawai', icon: RiUserAddLine },
  { label: 'Ringkasan JP', icon: RiBarChartHorizontalLine },
  { label: 'Atur dashboard', icon: RiSettings3Line },
  { label: 'Arsip diklat', icon: RiFileList3Line },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const authQuery = useSessionUser()

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    onSuccess: async () => {
      queryClient.clear()
      await navigate({ to: '/' })
    },
  })

  const pageMeta = useMemo(
    () => NAV_ITEMS.find((item) => pathname.endsWith(item.to)) || NAV_ITEMS[0],
    [pathname],
  )

  useEffect(() => {
    if (authQuery.isError || !authQuery.data?.user) {
      navigate({ to: '/' })
    }
  }, [authQuery.data?.user, authQuery.isError, navigate])

  if (authQuery.isLoading) {
    return <main className="app-page p-4"><Card>Memuat sesi...</Card></main>
  }

  if (authQuery.isError || !authQuery.data?.user) {
    return null
  }

  const user = authQuery.data.user

  return (
    <main className="app-page bg-white p-3 md:p-4">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-3 rounded-lg border border-blue-100 bg-white p-2 shadow-sm lg:grid-cols-[250px_minmax(0,1fr)]">
        <Card className="panel-card flex flex-col gap-6 rounded-md border-blue-100 bg-white p-4 shadow-sm">
          <div className="rounded-md border border-blue-100 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-900 text-sm font-semibold text-white">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-blue-950">Informasi JP</div>
                <div className="text-xs text-blue-900/50">Dashboard pegawai</div>
              </div>
              <RiMenuLine className="text-blue-900/35" size={16} />
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = pathname.endsWith(item.to)
              return (
                <Link key={item.to} to={item.to}>
                  <div className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? 'border border-blue-100 bg-blue-50 font-medium text-blue-900' : 'border border-transparent text-blue-950/72 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-950'}`}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          <div className="space-y-3">
            <Text className="!text-xs !font-medium !uppercase !tracking-wide !text-blue-900/40">Shortcuts</Text>
            <div className="space-y-1">
              {SHORTCUTS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm text-blue-950/70 hover:border-blue-100 hover:bg-blue-50">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between rounded-md border border-blue-100 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-medium text-blue-900/70">
                <RiUserLine size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-950">{user.username}</div>
                <div className="text-xs text-blue-900/50">{user.role}</div>
              </div>
            </div>
            <Button size="xs" variant="light" color="blue" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </Card>

        <div className="grid gap-3">
          <Card className="panel-card rounded-md border-blue-100 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Text className="!text-xs !uppercase !tracking-wide !text-blue-900/40">Workspace</Text>
                <Title className="!mt-1 !text-[20px] !font-semibold !tracking-tight !text-blue-950">{pageMeta.label}</Title>
                <Text className="!mt-1 !text-sm !text-blue-900/55">Panel informasi pengembangan kompetensi pegawai.</Text>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-950">{user.username}</div>
                  <div className="text-xs text-blue-900/50">{user.role}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-medium text-blue-900/70">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-3">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}
