import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/context/AuthContext'

export default function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
