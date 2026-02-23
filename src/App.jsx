import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider, useAuth } from './context/AuthContext'
import FireworkEffect from './components/FireworkEffect'
import './index.css'

// Lazy load pages for better initial load time
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AppLayout = lazy(() => import('./components/AppLayout'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in-up">
        <img src="/vnpay-logo.svg" alt="System" className="w-20 h-20 mx-auto mb-4 animate-float" />
        <h1 className="text-2xl font-bold text-tet-gold font-[var(--font-display)]">
          TTHT & ANTT Lucky Draw
        </h1>
        <p className="text-tet-pink/50 mt-2 animate-pulse">Đang tải...</p>
      </div>
    </div>
  )
}

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      {!session ? <LoginPage /> : <AppLayout />}
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <FireworkEffect />
      <AppContent />
      <Analytics />
    </AuthProvider>
  )
}
