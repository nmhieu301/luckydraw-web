import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AppLayout from './components/AppLayout'
import FireworkEffect from './components/FireworkEffect'
import './index.css'

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <img src="/vnpay-logo.svg" alt="System" className="w-20 h-20 mx-auto mb-4 animate-float" />
          <h1 className="text-2xl font-bold text-tet-gold font-[var(--font-display)]">
            Lì Xì Lucky Draw
          </h1>
          <p className="text-tet-pink/50 mt-2 animate-pulse">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <AppLayout />
}

export default function App() {
  return (
    <AuthProvider>
      <FireworkEffect />
      <AppContent />
    </AuthProvider>
  )
}
