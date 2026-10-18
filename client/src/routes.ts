import { createBrowserRouter } from 'react-router';
import { lazy } from 'react';

const Root = lazy(() => import('./pages/Root'));
const Home = lazy(() => import('./pages/Home'));
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'));
const Login = lazy(() => import('./pages/portal/Login'));
const Dashboard = lazy(() => import('./pages/portal/Dashboard'));
const Tickets = lazy(() => import('./pages/portal/Tickets'));
const TicketDetail = lazy(() => import('./pages/portal/TicketDetail'));
const SupportTime = lazy(() => import('./pages/portal/SupportTime'));
const Meetings = lazy(() => import('./pages/portal/Meetings'));
const Plan = lazy(() => import('./pages/portal/Plan'));
const Account = lazy(() => import('./pages/portal/Account'));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
    ],
  },
  {
    path: '/portal/login',
    Component: Login,
  },
  {
    path: '/portal',
    Component: PortalLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'dashboard', Component: Dashboard },
      { path: 'tickets', Component: Tickets },
      { path: 'tickets/:id', Component: TicketDetail },
      { path: 'support-time', Component: SupportTime },
      { path: 'meetings', Component: Meetings },
      { path: 'plan', Component: Plan },
      { path: 'account', Component: Account },
    ],
  },
]);
