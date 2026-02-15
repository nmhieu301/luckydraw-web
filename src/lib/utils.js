/**
 * Format currency in Vietnamese style
 * e.g. 10000 -> "10.000đ"
 */
export function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + 'đ'
}

/**
 * Get current date in Asia/Bangkok timezone as YYYY-MM-DD string
 */
export function getTodayBangkok() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}

/**
 * Validate email is @vnpay.vn domain
 */
export function isValidVnpayEmail(email) {
    if (!email) return false
    const trimmed = email.trim().toLowerCase()
    return /^[^\s@]+@vnpay\.vn$/i.test(trimmed)
}

/**
 * Fixed prize pool structure
 * Total: 74 prizes, 3,000,000 VND budget
 */
const PRIZES = [
    { amount: 500000, qty: 1 },
    { amount: 200000, qty: 2 },
    { amount: 100000, qty: 4 },
    { amount: 50000, qty: 12 },
    { amount: 20000, qty: 55 },
]

export { PRIZES }

export const PRIZE_LIST = PRIZES.map(p => p.amount)

/**
 * Vietnamese error messages mapping
 */
export const ERROR_MESSAGES = {
    'Invalid login credentials': 'Thông tin đăng nhập không hợp lệ',
    'Email not confirmed': 'Email chưa được xác nhận',
    'Token has expired or is invalid': 'Mã OTP đã hết hạn hoặc không hợp lệ',
    'For security purposes, you can only request this after': 'Vui lòng đợi trước khi gửi lại mã OTP',
    'Email rate limit exceeded': 'Đã vượt quá giới hạn gửi email. Vui lòng thử lại sau',
    'otp_expired': 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới',
    'invalid_otp': 'Mã OTP không đúng. Vui lòng kiểm tra lại',
}

export function getVietnameseError(errorMessage) {
    if (!errorMessage) return 'Đã xảy ra lỗi. Vui lòng thử lại.'
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
        if (errorMessage.includes(key)) return value
    }
    return errorMessage
}

/**
 * Format date for display in Vietnamese
 */
export function formatDateVN(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export function formatDateTimeVN(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
