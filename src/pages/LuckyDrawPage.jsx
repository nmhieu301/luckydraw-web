import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getTodayBangkok, PRIZE_LIST } from '../lib/utils'

// Slot machine values for animation (envelopes + amounts)
const ENVELOPE_ICONS = ['🧧', '🏮', '🎋', '🐴', '🎊', '🎆']
const SLOT_ITEMS = [
    ...ENVELOPE_ICONS,
    ...ENVELOPE_ICONS,
    10000, 20000, 50000, 100000, 200000, 500000,
]

function Confetti() {
    const colors = ['#DC2626', '#F59E0B', '#FDE68A', '#FF6B6B', '#4ADE80', '#FB923C']
    const pieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
    }))

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    )
}

export default function LuckyDrawPage() {
    const { user, employee } = useAuth()
    const [todayResult, setTodayResult] = useState(null)
    const [spinning, setSpinning] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const slotRef = useRef(null)
    const [slotOffset, setSlotOffset] = useState(0)

    // Check if user already spun today
    const checkTodayResult = useCallback(async () => {
        if (!user) return
        const today = getTodayBangkok()
        try {
            const { data, error: fetchError } = await supabase
                .from('lucky_draw_results')
                .select('*')
                .eq('user_id', user.id)
                .eq('draw_date', today)
                .maybeSingle()

            if (fetchError) {
                console.error('Error checking today result:', fetchError)
                return
            }
            if (data) {
                setTodayResult(data)
            }
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        checkTodayResult()
    }, [checkTodayResult])

    async function handleSpin() {
        if (spinning || todayResult) return
        setError('')
        setSpinning(true)
        setShowResult(false)

        try {
            // Call server-side function for atomic spin
            const { data, error: rpcError } = await supabase.rpc('spin_lucky_draw')

            if (rpcError) {
                if (rpcError.message.includes('already spun')) {
                    setError('Bạn đã quay rồi hôm nay! Hãy quay lại ngày mai nhé.')
                    await checkTodayResult()
                    setSpinning(false)
                    return
                }
                throw rpcError
            }

            const amount = data

            // Calculate slot position to land on the result
            const targetIndex = PRIZE_LIST.indexOf(amount)
            const totalItems = SLOT_ITEMS.length
            // We want to spin through many items and land on the correct one
            const finalIndex = totalItems - PRIZE_LIST.length + targetIndex
            const itemHeight = 80
            const offset = finalIndex * itemHeight

            setSlotOffset(offset)

            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 2800))

            const result = { amount, draw_date: getTodayBangkok() }
            setTodayResult(result)
            setShowResult(true)
            setShowConfetti(true)

            setTimeout(() => setShowConfetti(false), 4000)
        } catch (err) {
            console.error('Spin error:', err)
            setError('Đã xảy ra lỗi khi quay thưởng. Vui lòng thử lại sau.')
        } finally {
            setSpinning(false)
        }
    }

    function getGreeting() {
        if (!employee) return 'Chào bạn!'
        return `Chào ${employee.full_name || user?.email?.split('@')[0]}! 🎊`
    }

    function getResultMessage(amount) {
        if (amount >= 200000) return '🎉 ĐẠI PHÁT! Chúc mừng bạn!'
        if (amount >= 100000) return '🎊 Tuyệt vời! Một lì xì hên!'
        if (amount >= 50000) return '🧧 Năm mới phát tài!'
        return '🎋 Chúc mừng năm mới!'
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
            {showConfetti && <Confetti />}

            {/* Greeting */}
            <div className="text-center mb-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold font-[var(--font-display)] text-tet-gold-light">
                    {getGreeting()}
                </h2>
                <p className="text-tet-pink/60 text-sm mt-1">
                    {getTodayBangkok().split('-').reverse().join('/')}
                </p>
            </div>

            {/* Lucky Envelope */}
            <div className="lucky-envelope p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-center relative z-10">
                    <img src="/vnpay-logo.svg" alt="VNPAY" className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-tet-gold-light mb-1 font-[var(--font-display)]">
                        Lì Xì May Mắn
                    </h3>
                    <p className="text-tet-pink/80 text-sm mb-4">Tết Bính Ngọ 2026</p>

                    {/* Slot Machine - only visible during spin */}
                    {spinning ? (
                        <div className="slot-container mb-5 mx-auto max-w-xs">
                            <div
                                ref={slotRef}
                                className="slot-strip"
                                style={{
                                    transform: `translateY(-${slotOffset}px)`,
                                    transition: 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
                                }}
                            >
                                {SLOT_ITEMS.map((val, i) => (
                                    <div key={i} className="slot-item">
                                        {typeof val === 'number' ? formatCurrency(val) : <span className="text-4xl">{val}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !todayResult && (
                        <div className="mb-5 mx-auto max-w-xs py-6">
                            <div className="text-7xl animate-float mb-3">🧧</div>
                            <p className="text-tet-gold/70 text-sm font-medium">Bấm nút bên dưới để mở lì xì!</p>
                            <div className="flex justify-center gap-2 mt-3">
                                <span className="text-2xl opacity-60 animate-float" style={{ animationDelay: '0s' }}>🏮</span>
                                <span className="text-2xl opacity-40 animate-float" style={{ animationDelay: '0.5s' }}>✨</span>
                                <span className="text-2xl opacity-60 animate-float" style={{ animationDelay: '1s' }}>🏮</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Today's result */}
                    {todayResult && !spinning && (
                        <div className={`mb-4 ${showResult ? 'animate-bounce-in' : 'animate-fade-in-up'}`}>
                            <p className="text-tet-pink/80 text-sm mb-2">
                                {showResult ? getResultMessage(todayResult.amount) : 'Kết quả hôm nay của bạn:'}
                            </p>
                            <div className="text-4xl font-bold text-tet-gold font-[var(--font-display)] animate-pulse-glow inline-block px-6 py-3 rounded-2xl bg-surface/50">
                                {formatCurrency(todayResult.amount)}
                            </div>
                        </div>
                    )}

                    {/* Spin button */}
                    {!todayResult ? (
                        <button
                            id="spin-btn"
                            onClick={handleSpin}
                            disabled={spinning}
                            className="w-full max-w-xs py-4 px-8 rounded-2xl font-bold text-lg text-surface bg-gradient-to-r from-tet-gold via-yellow-400 to-tet-gold hover:from-yellow-400 hover:via-tet-gold hover:to-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl shadow-tet-gold/30 animate-pulse-glow"
                        >
                            {spinning ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Đang quay...
                                </span>
                            ) : '🎰 Quay Lì Xì'}
                        </button>
                    ) : (
                        <div className="text-sm text-tet-pink/50 mt-2">
                            ⏰ Bạn đã quay hôm nay. Hẹn gặp lại ngày mai!
                        </div>
                    )}
                </div>
            </div>

            {/* Prize table */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h4 className="text-sm font-semibold text-tet-gold mb-3 flex items-center gap-2">
                    <span>📊</span> Bảng giải thưởng
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { amount: 10000, chance: '35%' },
                        { amount: 20000, chance: '25%' },
                        { amount: 50000, chance: '20%' },
                        { amount: 100000, chance: '12%' },
                        { amount: 200000, chance: '6%' },
                        { amount: 500000, chance: '2%' },
                    ].map(p => (
                        <div key={p.amount} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface/50 border border-tet-gold/10">
                            <span className="text-tet-gold-light font-semibold text-sm">{formatCurrency(p.amount)}</span>
                            <span className="text-tet-pink/50 text-xs">{p.chance}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
