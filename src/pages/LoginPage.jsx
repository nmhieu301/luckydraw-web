import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { isValidVnpayEmail, getVietnameseError } from '../lib/utils'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState('email') // 'email' | 'otp'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const cooldownRef = useRef(null)

    function startCooldown(seconds = 60) {
        setCooldown(seconds)
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    async function handleSendOTP(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        const trimmedEmail = email.trim().toLowerCase()

        if (!isValidVnpayEmail(trimmedEmail)) {
            setError('Chỉ chấp nhận email công ty @vnpay.vn')
            return
        }

        setLoading(true)
        try {
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: trimmedEmail,
                options: {
                    shouldCreateUser: true,
                },
            })

            if (authError) {
                setError(getVietnameseError(authError.message))
                return
            }

            setStep('otp')
            setSuccess('Mã OTP đã được gửi đến email của bạn')
            startCooldown(60)
        } catch (err) {
            setError('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyOTP(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!otp || otp.length < 6) {
            setError('Vui lòng nhập đủ 6 số OTP')
            return
        }

        setLoading(true)
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: email.trim().toLowerCase(),
                token: otp,
                type: 'email',
            })

            if (verifyError) {
                setError(getVietnameseError(verifyError.message))
                return
            }
            // Auth state change will handle redirect
        } catch (err) {
            setError('Lỗi xác thực. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    async function handleResendOTP() {
        if (cooldown > 0) return
        setError('')
        setLoading(true)
        try {
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
            })
            if (authError) {
                setError(getVietnameseError(authError.message))
                return
            }
            setSuccess('Đã gửi lại mã OTP')
            startCooldown(60)
        } catch {
            setError('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float select-none">🏮</div>
            <div className="absolute top-20 right-16 text-5xl opacity-15 animate-float select-none" style={{ animationDelay: '1s' }}>🧧</div>
            <div className="absolute bottom-20 left-20 text-4xl opacity-10 animate-float select-none" style={{ animationDelay: '2s' }}>🎋</div>
            <div className="absolute bottom-10 right-10 text-6xl opacity-15 animate-float select-none" style={{ animationDelay: '0.5s' }}>🐴</div>

            <div className="w-full max-w-md">
                {/* Logo area */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="text-7xl mb-4">🧧</div>
                    <h1 className="text-3xl font-bold font-[var(--font-display)] bg-gradient-to-r from-tet-gold via-yellow-300 to-tet-gold bg-clip-text text-transparent">
                        Lì Xì Lucky Draw
                    </h1>
                    <p className="text-tet-pink mt-2 text-sm">Tết Bính Ngọ 2026 • VNPAY</p>
                </div>

                {/* Login card */}
                <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl font-semibold text-center mb-6 text-tet-gold-light">
                        {step === 'email' ? 'Đăng nhập' : 'Nhập mã OTP'}
                    </h2>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                            <span className="mt-0.5">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success message */}
                    {success && (
                        <div className="mb-4 p-3 rounded-xl bg-green-900/30 border border-green-500/30 text-green-300 text-sm flex items-start gap-2">
                            <span className="mt-0.5">✅</span>
                            <span>{success}</span>
                        </div>
                    )}

                    {step === 'email' ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-tet-gold-light/80 mb-2">
                                    Email công ty
                                </label>
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="ten@vnpay.vn"
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-tet-gold/20 text-tet-red-light placeholder-tet-red-light/30 focus:outline-none focus:border-tet-gold/60 focus:ring-2 focus:ring-tet-gold/20 transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                id="send-otp-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-surface bg-gradient-to-r from-tet-gold to-yellow-400 hover:from-yellow-400 hover:to-tet-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-tet-gold/20"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang gửi...
                                    </span>
                                ) : 'Gửi mã OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-tet-gold-light/80 mb-2">
                                    Mã OTP (6 số)
                                </label>
                                <input
                                    id="otp-input"
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-tet-gold/20 text-tet-red-light placeholder-tet-red-light/30 focus:outline-none focus:border-tet-gold/60 focus:ring-2 focus:ring-tet-gold/20 transition-all text-center text-2xl tracking-[0.5em] font-mono"
                                    maxLength={6}
                                    autoFocus
                                />
                                <p className="mt-2 text-xs text-tet-pink/60">
                                    Kiểm tra hộp thư <strong>{email}</strong>
                                </p>
                            </div>

                            <button
                                id="verify-otp-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-surface bg-gradient-to-r from-tet-gold to-yellow-400 hover:from-yellow-400 hover:to-tet-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-tet-gold/20"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang xác thực...
                                    </span>
                                ) : 'Xác nhận'}
                            </button>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setOtp(''); setError(''); setSuccess('') }}
                                    className="text-sm text-tet-gold/70 hover:text-tet-gold transition-colors"
                                >
                                    ← Đổi email
                                </button>
                                <button
                                    id="resend-otp-btn"
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={cooldown > 0 || loading}
                                    className="text-sm text-tet-gold/70 hover:text-tet-gold disabled:text-tet-red-light/30 disabled:cursor-not-allowed transition-colors"
                                >
                                    {cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại OTP'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-tet-pink/40 mt-6">
                    © 2026 VNPAY • Chúc Mừng Năm Mới 🎆
                </p>
            </div>
        </div>
    )
}
