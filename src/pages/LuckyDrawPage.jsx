import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getTodayBangkok, PRIZE_LIST, PRIZES } from '../lib/utils'

// Slot machine values for animation
const SLOT_LABELS = ['Lì Xì', 'May Mắn', 'Phát Tài', 'An Khang', 'Hạnh Phúc', 'Tài Lộc']
const SLOT_ITEMS = [
    ...SLOT_LABELS,
    ...SLOT_LABELS,
    22222, 68686, 86868, 123456, 456789,
]

// Prize tier styling — big to small, with emojis, colors, and sizes
const PRIZE_TIERS = [
    { amount: 456789, emoji: '👑', label: 'JACKPOT', color: 'from-yellow-300 via-amber-400 to-yellow-500', glow: 'shadow-amber-400/40', textSize: 'text-2xl', ring: 'ring-2 ring-amber-400/50' },
    { amount: 123456, emoji: '💎', label: 'Kim Cương', color: 'from-cyan-300 via-blue-400 to-indigo-400', glow: 'shadow-blue-400/30', textSize: 'text-xl', ring: 'ring-2 ring-blue-400/40' },
    { amount: 86868, emoji: '🔥', label: 'Phát Lộc', color: 'from-orange-300 via-red-400 to-rose-400', glow: 'shadow-red-400/25', textSize: 'text-lg', ring: 'ring-1 ring-red-400/30' },
    { amount: 68686, emoji: '🎯', label: 'Lộc Phát', color: 'from-emerald-300 via-green-400 to-teal-400', glow: 'shadow-green-400/20', textSize: 'text-base', ring: 'ring-1 ring-green-400/30' },
    { amount: 22222, emoji: '🍀', label: 'May Mắn', color: 'from-pink-300 via-rose-300 to-fuchsia-300', glow: 'shadow-pink-300/15', textSize: 'text-sm', ring: '' },
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

function PhoneInputForm({ onSaved }) {
    const [phone, setPhone] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        const trimmed = phone.trim()
        if (!/^0\d{8,9}$/.test(trimmed)) {
            setError('Số điện thoại không hợp lệ (VD: 0901234567)')
            return
        }
        setError('')
        setSaving(true)
        try {
            const { error: rpcError } = await supabase.rpc('save_my_phone', { phone: trimmed })
            if (rpcError) throw rpcError
            setSaved(true)
            onSaved?.(trimmed)
        } catch (err) {
            setError('Lỗi lưu SĐT: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (saved) {
        return (
            <div className="mt-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20 text-emerald-300/90 text-sm animate-fade-in-up">
                ✅ Đã lưu SĐT <strong>{phone}</strong>. Lì xì sẽ được chuyển qua Ví VNPAY sau <strong>01/03/2026</strong>.
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 animate-fade-in-up">
            <div className="p-4 rounded-xl bg-surface/60 border border-tet-gold/20">
                <p className="text-sm text-tet-gold-light mb-3 font-medium">
                    📱 Nhập SĐT App VNPAY để nhận lì xì
                </p>
                <div className="flex gap-2">
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="0901234567"
                        maxLength={11}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-tet-gold/20 text-tet-pink text-sm placeholder-tet-pink/30 focus:outline-none focus:ring-2 focus:ring-tet-gold/40 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-tet-gold to-yellow-400 text-surface font-semibold text-sm disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                    >
                        {saving ? '...' : 'Lưu'}
                    </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                <p className="text-tet-pink/40 text-xs mt-2">
                    Lì xì sẽ chuyển qua Ví VNPAY sau 01/03/2026
                </p>
            </div>
        </form>
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
    const [phoneSaved, setPhoneSaved] = useState(false)
    const slotRef = useRef(null)
    const [slotOffset, setSlotOffset] = useState(0)

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
                if (todayData.phone_number) setPhoneSaved(true)
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
            const targetIndex = PRIZE_LIST.indexOf(amount)
            const totalItems = SLOT_ITEMS.length
            const finalIndex = totalItems - PRIZE_LIST.length + targetIndex
            const itemHeight = 80
            const offset = finalIndex * itemHeight

            setSlotOffset(offset)
            await new Promise(resolve => setTimeout(resolve, 2800))

            const result = { amount, draw_date: getTodayBangkok() }
            setTodayResult(result)
            setShowResult(true)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 4000)
        } catch (err) {
            console.error('Spin error:', err)
            setError(`Đã xảy ra lỗi khi quay thưởng. Vui lòng thử lại sau.`)
        } finally {
            setSpinning(false)
        }
    }

    function getGreeting() {
        if (!employee) return 'Chào bạn!'
        return `Chào ${employee.full_name || user?.email?.split('@')[0]}! 🎊`
    }

    function getResultMessage(amount) {
        const tier = PRIZE_TIERS.find(t => t.amount === amount)
        if (tier) return `${tier.emoji} ${tier.label}! Chúc mừng bạn!`
        if (amount >= 100000) return '🎊 Tuyệt vời! Chúc mừng bạn!'
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

                    {/* Slot Machine */}
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
                                {getResultMessage(todayResult.amount)}
                            </p>
                            <div className="text-4xl font-bold text-tet-gold font-[var(--font-display)] animate-pulse-glow inline-block px-6 py-3 rounded-2xl bg-surface/50">
                                {formatCurrency(todayResult.amount)}
                            </div>

                            {/* Phone input or saved confirmation */}
                            {!phoneSaved ? (
                                <PhoneInputForm onSaved={(p) => setPhoneSaved(true)} />
                            ) : (
                                <div className="mt-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20 text-emerald-300/90 text-sm leading-relaxed">
                                    ✅ Kết quả đã được ghi nhận{todayResult.phone_number ? ` • SĐT: ${todayResult.phone_number}` : ''}.<br />
                                    Đại diện phòng sẽ chuyển lì xì qua <strong>Ví VNPAY</strong> sau <strong>01/03/2026</strong>.
                                </div>
                            )}
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

            {/* Creative Prize Tiers Display */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h4 className="text-center text-sm font-semibold text-tet-gold mb-4">
                    🏆 Các mức giải thưởng
                </h4>
                <div className="space-y-3">
                    {PRIZE_TIERS.map((tier, i) => (
                        <div
                            key={tier.amount}
                            className={`relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r ${tier.color} shadow-lg ${tier.glow} transition-all duration-300 hover:scale-[1.02]`}
                            style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                        >
                            <div className={`bg-surface/90 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 ${tier.ring}`}>
                                <span className={`${i === 0 ? 'text-3xl' : i === 1 ? 'text-2xl' : 'text-xl'} flex-shrink-0`}>
                                    {tier.emoji}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold ${tier.textSize} bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                                        {formatCurrency(tier.amount)}
                                    </div>
                                    <div className="text-xs text-tet-pink/50 mt-0.5">{tier.label}</div>
                                </div>
                                {i === 0 && (
                                    <div className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-medium animate-pulse">
                                        TOP
                                    </div>
                                )}
                                {i === 1 && (
                                    <div className="text-xs px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 font-medium">
                                        HOT
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-center text-xs text-tet-pink/30 mt-4">
                    Mỗi người chỉ quay 1 lần • Hên xui thôi nha! 🎲
                </p>
            </div>
        </div>
    )
}
