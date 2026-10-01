import { Outlet } from 'react-router-dom'
import AppShell from '../components/AppShell'

export default function CMSLayout() {
  return <AppShell><Outlet /></AppShell>
}
