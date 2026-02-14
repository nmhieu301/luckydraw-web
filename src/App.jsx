import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AppLayout from './components/AppLayout'
import './index.css'

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4 animate-float">🧧</div>
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
      <AppContent />
    </AuthProvider>
  )
}
