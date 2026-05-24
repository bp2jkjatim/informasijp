import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { AdminLayout } from './layouts/AdminLayout'
import { AppIndexPage } from './screens/AppIndexPage'
import { DiklatPage } from './screens/DiklatPage'
import { EmployeesPage } from './screens/EmployeesPage'
import { ExportPage } from './screens/ExportPage'
import { LoginPage } from './screens/LoginPage'

const basepath = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''

function RootLayout() {
  return <Outlet />
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: AdminLayout,
})

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: AppIndexPage,
})

const diklatRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/diklat',
  component: DiklatPage,
})

const employeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pegawai',
  component: EmployeesPage,
})

const exportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/export',
  component: ExportPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([appIndexRoute, diklatRoute, employeesRoute, exportRoute]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  basepath,
})
