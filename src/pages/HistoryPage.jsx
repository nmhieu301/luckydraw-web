import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateVN, formatDateTimeVN } from '../lib/utils'

export default function HistoryPage() {
    const { user } = useAuth()
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, totalAmount: 0 })

    useEffect(() => {
        if (!user) return
        fetchHistory()
    }, [user])

    async function fetchHistory() {
        setLoading(true)
        try {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('lucky_draw_results')
                .select('*')
                .eq('user_id', user.id)
                .gte('draw_date', fromDate)
                .order('draw_date', { ascending: false })

            if (error) {
                console.error('Error fetching history:', error)
                return
            }

            setResults(data || [])
            const totalAmount = (data || []).reduce((sum, r) => sum + r.amount, 0)
            setStats({ total: data?.length || 0, totalAmount })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-tet-gold animate-pulse text-lg">Đang tải...</div>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold font-[var(--font-display)] text-tet-gold-light mb-6 animate-fade-in-up">
                📋 Lịch sử quay thưởng
            </h2>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-tet-gold font-[var(--font-display)]">{stats.total}</div>
                    <div className="text-xs text-tet-pink/60 mt-1">Lượt quay</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-tet-gold font-[var(--font-display)]">
                        {formatCurrency(stats.totalAmount)}
                    </div>
                    <div className="text-xs text-tet-pink/60 mt-1">Tổng nhận</div>
                </div>
            </div>

            {/* Results list */}
            {results.length === 0 ? (
                <div className="glass-card p-8 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="text-5xl mb-3">🎋</div>
                    <p className="text-tet-pink/60">Bạn chưa có lịch sử quay thưởng</p>
                    <p className="text-tet-pink/40 text-sm mt-1">Hãy thử vận may ngay nào!</p>
                </div>
            ) : (
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {results.map((result, index) => (
                        <div
                            key={result.id}
                            className="glass-card p-4 flex items-center justify-between hover:border-tet-gold/30 transition-colors"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-tet-red/20 flex items-center justify-center text-lg">
                                    🎁
                                </div>
                                <div>
                                    <div className="text-sm text-tet-gold-light font-medium">
                                        {formatDateVN(result.draw_date)}
                                    </div>
                                    <div className="text-xs text-tet-pink/40">
                                        {formatDateTimeVN(result.created_at)}
                                    </div>
                                </div>
                            </div>
                            <div className={`font-bold font-[var(--font-display)] ${result.amount >= 200000 ? 'text-yellow-400 text-xl' :
                                result.amount >= 100000 ? 'text-tet-gold text-lg' :
                                    'text-tet-gold-light'
                                }`}>
                                {formatCurrency(result.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-center text-xs text-tet-pink/30 mt-6">
                Hiển thị 30 ngày gần nhất
            </p>
        </div>
    )
}
