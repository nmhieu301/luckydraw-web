import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getTodayBangkok, PRIZE_LIST, PRIZES } from '../lib/utils'

// Slot machine values for animation (Vietnamese labels + amounts)
const SLOT_LABELS = ['Lì Xì', 'May Mắn', 'Phát Tài', 'An Khang', 'Hạnh Phúc', 'Tài Lộc']
const SLOT_ITEMS = [
    ...SLOT_LABELS,
    ...SLOT_LABELS,
    22222, 68686, 86868, 123456, 456789,
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

    // Check if user already spun
    const checkTodayResult = useCallback(async () => {
        if (!user) return
        try {
            const { data, error: fetchError } = await supabase.rpc('get_my_today_result')

            const todayData = Array.isArray(data) ? data[0] : data

            if (fetchError) {
                console.error('Error checking result:', fetchError)
                return
            }
            if (todayData) {
                setTodayResult(todayData)
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
                if (rpcError.message.includes('đã quay') || rpcError.message.includes('already')) {
                    setError('Bạn đã quay lì xì rồi!')
                    await checkTodayResult()
                    setSpinning(false)
                    return
                }
                if (rpcError.message.includes('hết')) {
                    setError('Giải thưởng đã hết! Vui lòng liên hệ Admin.')
                    setSpinning(false)
                    return
                }
                throw rpcError
            }

            const amount = data

            // Calculate slot position to land on the result
            const targetIndex = PRIZE_LIST.indexOf(amount)
            const totalItems = SLOT_ITEMS.length
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
        if (amount >= 50000) return '🎁 Năm mới phát tài!'
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

            {/* Program end date banner */}
            <div className="mb-4 p-3 rounded-xl bg-amber-900/30 border border-tet-gold/30 text-center animate-fade-in-up">
                <p className="text-sm text-tet-gold">
                    ⏳ Chương trình kết thúc ngày <strong>01/03/2026</strong>. Chi trả tập trung sau khi kết thúc.
                </p>
            </div>

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
                    <img src="/vnpay-logo.svg" alt="System" className="w-16 h-16 mx-auto mb-3" />
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
                                        {typeof val === 'number' ? formatCurrency(val) : <span className="text-lg font-bold text-tet-gold">{val}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !todayResult && (
                        <div className="mb-5 mx-auto max-w-xs py-6">
                            <img src="/vnpay-logo.svg" alt="Lì Xì" className="w-24 h-24 mx-auto animate-float mb-3" />
                            <p className="text-tet-gold/70 text-sm font-medium">Bấm nút bên dưới để mở lì xì!</p>
                            <div className="flex justify-center gap-3 mt-3">
                                <span className="text-sm opacity-60 animate-float text-tet-gold" style={{ animationDelay: '0s' }}>✨</span>
                                <span className="text-sm opacity-80 animate-float text-yellow-300" style={{ animationDelay: '0.3s' }}>Chúc Mừng Năm Mới</span>
                                <span className="text-sm opacity-60 animate-float text-tet-gold" style={{ animationDelay: '0.6s' }}>✨</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Result display */}
                    {todayResult && !spinning && (
                        <div className={`mb-4 ${showResult ? 'animate-bounce-in' : 'animate-fade-in-up'}`}>
                            <p className="text-tet-pink/80 text-sm mb-2">
                                {showResult ? getResultMessage(todayResult.amount) : '✅ Bạn đã quay thành công:'}
                            </p>
                            <div className="text-4xl font-bold text-tet-gold font-[var(--font-display)] animate-pulse-glow inline-block px-6 py-3 rounded-2xl bg-surface/50">
                                {formatCurrency(todayResult.amount)}
                            </div>
                            <div className="mt-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20 text-emerald-300/90 text-sm leading-relaxed">
                                ✅ Kết quả đã được ghi nhận.<br />
                                Đại diện phòng sẽ chuyển lì xì qua <strong>Ví VNPAY</strong> sau <strong>01/03/2026</strong>.
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
                            🎁 Bạn đã nhận lì xì. Mỗi người chỉ quay 1 lần duy nhất.
                        </div>
                    )}
                </div>
            </div>

            {/* Prize table */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h4 className="text-sm font-semibold text-tet-gold mb-3 flex items-center gap-2">
                    <span>📊</span> Cơ cấu giải thưởng
                </h4>
                <div className="space-y-2">
                    {PRIZES.map(p => (
                        <div key={p.amount} className="flex items-center justify-center px-3 py-2 rounded-lg bg-surface/50 border border-tet-gold/10">
                            <span className="text-tet-gold-light font-semibold text-sm">{formatCurrency(p.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
