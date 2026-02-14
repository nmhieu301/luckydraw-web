import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LuckyDrawPage from '../pages/LuckyDrawPage'
import HistoryPage from '../pages/HistoryPage'
import AdminPage from '../pages/AdminPage'

const TABS = [
    { id: 'draw', label: '🎰 Quay thưởng', icon: '🎰' },
    { id: 'history', label: '📋 Lịch sử', icon: '📋' },
]

const ADMIN_TAB = { id: 'admin', label: '👥 Quản lý', icon: '👥' }

export default function AppLayout() {
    const { user, employee, isAdmin, signOut } = useAuth()
    const [activeTab, setActiveTab] = useState('draw')

    const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS

    function renderPage() {
        switch (activeTab) {
            case 'draw': return <LuckyDrawPage />
            case 'history': return <HistoryPage />
            case 'admin': return isAdmin ? <AdminPage /> : <LuckyDrawPage />
            default: return <LuckyDrawPage />
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-tet-gold/10 bg-surface/80 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/vnpay-logo.svg" alt="VNPAY" className="w-9 h-9" />
                        <div>
                            <h1 className="text-sm font-bold text-tet-gold font-[var(--font-display)]">Lucky Draw</h1>
                            <p className="text-xs text-tet-pink/40">Tết 2026</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-tet-gold-light font-medium">
                                {employee?.full_name || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-tet-pink/40">{user?.email}</p>
                        </div>
                        {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-tet-gold/20 text-tet-gold text-xs font-medium hidden sm:inline">
                                Admin
                            </span>
                        )}
                        <button
                            id="logout-btn"
                            onClick={signOut}
                            className="px-3 py-1.5 rounded-lg bg-surface-hover border border-tet-gold/10 text-tet-pink/60 text-xs hover:text-tet-red-light hover:border-tet-red/30 transition-colors"
                            title="Đăng xuất"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 pb-20 md:pb-6">
                {renderPage()}
            </main>

            {/* Bottom tab bar (mobile) / Top tabs (desktop) */}
            <nav className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto border-t border-tet-gold/10 bg-surface/90 backdrop-blur-xl z-40">
                <div className="max-w-2xl mx-auto flex">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 md:py-2.5 flex flex-col md:flex-row items-center justify-center gap-1 text-xs font-medium transition-all ${activeTab === tab.id
                                ? 'text-tet-gold border-t-2 border-tet-gold md:border-t-0 md:border-b-2 bg-tet-gold/5'
                                : 'text-tet-pink/40 hover:text-tet-pink/70 border-t-2 border-transparent md:border-t-0 md:border-b-2'
                                }`}
                        >
                            <span className="text-lg md:text-base">{tab.icon}</span>
                            <span className="md:ml-1">{tab.label.split(' ').slice(1).join(' ')}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    )
}
