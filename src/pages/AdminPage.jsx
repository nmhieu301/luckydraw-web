import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateVN, formatDateTimeVN, isValidVnpayEmail, getTodayBangkok } from '../lib/utils'
import * as XLSX from 'xlsx'

function EmployeeList({ employees, loading, onReset, onResetAll, onToggleRole, onViewHistory, onDelete, searchTerm, setSearchTerm }) {
    const filtered = employees.filter(emp =>
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div>
            {/* Search */}
            <div className="mb-4">
                <input
                    id="search-employees"
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="🔍 Tìm theo email hoặc họ tên..."
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-tet-gold/20 text-tet-red-light placeholder-tet-red-light/30 focus:outline-none focus:border-tet-gold/60 focus:ring-2 focus:ring-tet-gold/20 transition-all"
                />
            </div>

            {loading ? (
                <div className="text-center py-8 text-tet-gold animate-pulse">Đang tải...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-tet-pink/50">Không tìm thấy nhân viên</div>
            ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {filtered.map((emp, idx) => (
                        <div key={emp.id} className="glass-card p-4 hover:border-tet-gold/30 transition-colors relative" style={{ zIndex: filtered.length - idx }}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-tet-gold-light text-sm truncate">{emp.full_name}</span>
                                        {emp.role === 'admin' && (
                                            <span className="px-2 py-0.5 rounded-full bg-tet-gold/20 text-tet-gold text-xs font-medium">Admin</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-tet-pink/50 mt-1">{emp.email}</div>
                                    {emp.department && (
                                        <div className="text-xs text-tet-pink/40 mt-0.5">📁 {emp.department}</div>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="text-xs text-tet-pink/40">
                                            🎰 {emp.spin_count || 0} lần
                                        </span>
                                        {emp.total_amount > 0 && (
                                            <span className="text-xs text-tet-gold/60">
                                                💰 {formatCurrency(emp.total_amount)}
                                            </span>
                                        )}
                                        {emp.last_spin_date && (
                                            <span className="text-xs text-tet-pink/40">
                                                📅 {formatDateVN(emp.last_spin_date)}
                                            </span>
                                        )}
                                        {emp.last_login_at ? (
                                            <span className="text-xs text-green-400/60">✓ Online</span>
                                        ) : (
                                            <span className="text-xs text-tet-pink/30">○ Chưa login</span>
                                        )}
                                    </div>
                                </div>
                                {/* Actions dropdown */}
                                <EmployeeActions
                                    emp={emp}
                                    onReset={onReset}
                                    onResetAll={onResetAll}
                                    onToggleRole={onToggleRole}
                                    onViewHistory={onViewHistory}
                                    onDelete={onDelete}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="text-xs text-tet-pink/30 mt-3 text-right">
                Hiển thị {filtered.length}/{employees.length} nhân viên
            </div>
        </div>
    )
}

function EmployeeActions({ emp, onReset, onResetAll, onToggleRole, onViewHistory, onDelete }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="px-2 py-1.5 rounded-lg bg-surface-hover border border-tet-gold/10 text-tet-gold text-sm hover:bg-tet-gold/10 transition-colors"
            >
                ⋯
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-surface border border-tet-gold/20 shadow-xl z-20 py-1 animate-fade-in-up">
                    <button
                        onClick={() => { onViewHistory(emp); setOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-tet-red-light hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                        📋 Xem lịch sử quay
                    </button>
                    <button
                        onClick={() => { onReset(emp); setOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-tet-red-light hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                        🔄 Reset lượt hôm nay
                    </button>
                    <button
                        onClick={() => { onResetAll(emp); setOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                        🗑️ Xoá toàn bộ lịch sử
                    </button>
                    <div className="border-t border-tet-gold/10 my-1" />
                    <button
                        onClick={() => { onToggleRole(emp); setOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-tet-gold hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                        {emp.role === 'admin' ? '👤 Hạ quyền Staff' : '👑 Nâng quyền Admin'}
                    </button>
                    <div className="border-t border-tet-gold/10 my-1" />
                    <button
                        onClick={() => { onDelete(emp); setOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                        ❌ Xoá user
                    </button>
                </div>
            )}
        </div>
    )
}

function HistoryModal({ emp, onClose }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [])

    async function fetchHistory() {
        const { data, error } = await supabase.rpc('admin_get_history', { target_email: emp.email })
        if (error) console.error('History error:', error)
        setHistory(data || [])
        setLoading(false)
    }

    const total = history.reduce((sum, r) => sum + r.amount, 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card w-full max-w-md max-h-[80vh] overflow-hidden animate-bounce-in" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-tet-gold/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-tet-gold-light font-[var(--font-display)]">{emp.full_name}</h3>
                            <p className="text-xs text-tet-pink/50">{emp.email}</p>
                        </div>
                        <button onClick={onClose} className="text-tet-pink/40 hover:text-tet-red-light text-xl">✕</button>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <div className="px-3 py-1.5 rounded-lg bg-surface/50 text-xs text-tet-gold">
                            🎰 {history.length} lượt
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-surface/50 text-xs text-tet-gold">
                            💰 {formatCurrency(total)}
                        </div>
                    </div>
                </div>
                <div className="p-5 overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="text-center py-6 text-tet-gold animate-pulse">Đang tải...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-6 text-tet-pink/50">Chưa có lịch sử quay</div>
                    ) : (
                        <div className="space-y-2">
                            {history.map(r => (
                                <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface/50 border border-tet-gold/5">
                                    <div>
                                        <div className="text-sm text-tet-gold-light">{formatDateVN(r.draw_date)}</div>
                                        <div className="text-xs text-tet-pink/40">{formatDateTimeVN(r.created_at)}</div>
                                    </div>
                                    <div className={`font-bold font-[var(--font-display)] ${r.amount >= 200000 ? 'text-yellow-400' :
                                        r.amount >= 100000 ? 'text-tet-gold' : 'text-tet-gold-light'
                                        }`}>
                                        {formatCurrency(r.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatsPanel({ employees }) {
    const [prizePool, setPrizePool] = useState([])

    useEffect(() => {
        supabase.from('prize_pool').select('*').order('amount', { ascending: false })
            .then(({ data }) => setPrizePool(data || []))
    }, [])

    const totalEmployees = employees.length
    const totalSpins = employees.reduce((sum, e) => sum + (e.spin_count || 0), 0)
    const totalAmount = employees.reduce((sum, e) => sum + (e.total_amount || 0), 0)
    const loggedIn = employees.filter(e => e.last_login_at).length
    const today = getTodayBangkok()
    const spunToday = employees.filter(e => e.last_spin_date === today).length

    const totalPrizes = prizePool.reduce((s, p) => s + p.total_qty, 0)
    const totalRemaining = prizePool.reduce((s, p) => s + p.remaining_qty, 0)
    const totalWon = totalPrizes - totalRemaining

    return (
        <div className="mb-4 space-y-3">
            {/* Employee stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="glass-card p-3 text-center">
                    <div className="text-lg font-bold text-tet-gold font-[var(--font-display)]">{totalEmployees}</div>
                    <div className="text-xs text-tet-pink/50">Nhân viên</div>
                </div>
                <div className="glass-card p-3 text-center">
                    <div className="text-lg font-bold text-tet-gold font-[var(--font-display)]">{totalSpins}</div>
                    <div className="text-xs text-tet-pink/50">Tổng lượt quay</div>
                </div>
                <div className="glass-card p-3 text-center">
                    <div className="text-lg font-bold text-tet-gold font-[var(--font-display)]">{formatCurrency(totalAmount)}</div>
                    <div className="text-xs text-tet-pink/50">Tổng đã phát</div>
                </div>
                <div className="glass-card p-3 text-center">
                    <div className="text-lg font-bold text-tet-gold font-[var(--font-display)]">{spunToday}/{loggedIn}</div>
                    <div className="text-xs text-tet-pink/50">Quay hôm nay</div>
                </div>
            </div>

            {/* Prize pool stats */}
            {prizePool.length > 0 && (
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-tet-gold flex items-center gap-2">
                            🏆 Thống kê giải thưởng
                        </h4>
                        <span className="text-xs text-tet-pink/50">
                            Đã trúng: <strong className="text-tet-gold">{totalWon}</strong>/{totalPrizes}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {prizePool.map(p => {
                            const won = p.total_qty - p.remaining_qty
                            const pct = p.total_qty > 0 ? (won / p.total_qty) * 100 : 0
                            return (
                                <div key={p.id} className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-tet-gold-light w-24 text-right flex-shrink-0">
                                        {formatCurrency(p.amount)}
                                    </span>
                                    <div className="flex-1 h-5 bg-surface/80 rounded-full overflow-hidden border border-tet-gold/10">
                                        <div
                                            className="h-full bg-gradient-to-r from-tet-gold to-yellow-400 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-tet-pink/60 w-16 text-right flex-shrink-0">
                                        <strong className={won > 0 ? 'text-yellow-400' : 'text-tet-pink/40'}>{won}</strong>
                                        <span className="text-tet-pink/30">/{p.total_qty}</span>
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function ExcelImport({ onImportDone }) {
    const [preview, setPreview] = useState([])
    const [errors, setErrors] = useState([])
    const [importing, setImporting] = useState(false)
    const [imported, setImported] = useState(false)
    const fileRef = useRef(null)

    function handleFileChange(e) {
        const file = e.target.files[0]
        if (!file) return

        setPreview([])
        setErrors([])
        setImported(false)

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const json = XLSX.utils.sheet_to_json(ws, { defval: '' })

                const rows = []
                const errs = []

                json.forEach((row, idx) => {
                    // Support both structured (email + name) and email-only formats
                    // Check if first column key looks like an email (email-only file)
                    const keys = Object.keys(row)
                    let email = ''
                    if (keys.length === 1 && row[keys[0]].toString().includes('@')) {
                        email = row[keys[0]].toString().trim().toLowerCase()
                    } else if (keys[0] && !keys[0].match(/email|Email|EMAIL|họ_tên|ho_ten|full_name|phòng_ban|department|mã_nv/i) && row[keys[0]].toString().includes('@')) {
                        email = row[keys[0]].toString().trim().toLowerCase()
                    } else {
                        email = (row.email || row.Email || row.EMAIL || '').toString().trim().toLowerCase()
                    }
                    const fullName = (row['họ_tên'] || row.ho_ten || row.full_name || row['Họ tên'] || row['Ho ten'] || row.name || row.Name || '').toString().trim()
                    const department = (row['phòng_ban'] || row.phong_ban || row.department || row['Phòng ban'] || row.Department || '').toString().trim()
                    const employeeCode = (row['mã_nv'] || row.ma_nv || row.employee_code || row['Mã NV'] || '').toString().trim()

                    if (!email) {
                        errs.push({ row: idx + 2, message: 'Thiếu email' })
                        return
                    }
                    if (!isValidVnpayEmail(email)) {
                        errs.push({ row: idx + 2, message: `Email không hợp lệ: ${email}` })
                        return
                    }

                    // Auto-generate full_name from email prefix if missing
                    const derivedName = fullName || email.split('@')[0]

                    rows.push({ email, full_name: derivedName, department, employee_code: employeeCode || null })
                })

                setPreview(rows)
                setErrors(errs)
            } catch (err) {
                setErrors([{ row: 0, message: 'Lỗi đọc file Excel: ' + err.message }])
            }
        }
        reader.readAsBinaryString(file)
    }

    async function handleImport() {
        if (preview.length === 0) return
        setImporting(true)
        try {
            const { error } = await supabase
                .from('employees')
                .upsert(
                    preview.map(row => ({
                        ...row,
                        role: 'staff',
                    })),
                    { onConflict: 'email', ignoreDuplicates: false }
                )

            if (error) {
                setErrors([{ row: 0, message: 'Lỗi import: ' + error.message }])
                return
            }

            setImported(true)
            onImportDone()
        } catch (err) {
            setErrors([{ row: 0, message: 'Lỗi import: ' + err.message }])
        } finally {
            setImporting(false)
        }
    }

    return (
        <div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-tet-gold-light/80 mb-2">
                    📂 Chọn file Excel (.xlsx, .xls)
                </label>
                <input
                    id="excel-upload"
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-tet-gold/20 text-tet-red-light file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-tet-gold/20 file:text-tet-gold file:font-medium file:cursor-pointer hover:file:bg-tet-gold/30 transition-all"
                />
                <p className="text-xs text-tet-pink/40 mt-2">
                    Cột yêu cầu: email, họ_tên (hoặc full_name), phòng_ban (hoặc department). Tùy chọn: mã_nv
                </p>
            </div>

            {errors.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-500/30">
                    <p className="text-red-300 text-sm font-medium mb-1">⚠️ Lỗi ({errors.length} dòng):</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {errors.map((err, i) => (
                            <p key={i} className="text-red-300/80 text-xs">
                                {err.row > 0 ? `Dòng ${err.row}: ` : ''}{err.message}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {preview.length > 0 && !imported && (
                <div className="mb-4">
                    <p className="text-sm text-tet-gold-light font-medium mb-2">
                        Xem trước ({preview.length} nhân viên hợp lệ)
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-tet-gold/10">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-surface/80 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-tet-gold/80">#</th>
                                    <th className="px-3 py-2 text-tet-gold/80">Email</th>
                                    <th className="px-3 py-2 text-tet-gold/80">Họ tên</th>
                                    <th className="px-3 py-2 text-tet-gold/80">Phòng ban</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tet-gold/5">
                                {preview.slice(0, 50).map((row, i) => (
                                    <tr key={i} className="hover:bg-surface-hover/30">
                                        <td className="px-3 py-2 text-tet-pink/50">{i + 1}</td>
                                        <td className="px-3 py-2 text-tet-red-light">{row.email}</td>
                                        <td className="px-3 py-2 text-tet-red-light">{row.full_name}</td>
                                        <td className="px-3 py-2 text-tet-pink/50">{row.department}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {preview.length > 50 && (
                            <p className="text-xs text-tet-pink/30 p-2 text-center">...và {preview.length - 50} nhân viên khác</p>
                        )}
                    </div>

                    <button
                        id="import-btn"
                        onClick={handleImport}
                        disabled={importing}
                        className="mt-3 w-full py-3 px-4 rounded-xl font-semibold text-surface bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                        {importing ? 'Đang import...' : `✅ Import ${preview.length} nhân viên`}
                    </button>
                </div>
            )}

            {imported && (
                <div className="p-4 rounded-xl bg-green-900/30 border border-green-500/30 text-green-300 text-sm text-center">
                    ✅ Đã import thành công {preview.length} nhân viên!
                </div>
            )}
        </div>
    )
}

function AddEmailForm({ onAdded }) {
    const [email, setEmail] = useState('')
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    async function handleAdd(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        const trimmed = email.trim().toLowerCase()
        if (!isValidVnpayEmail(trimmed)) {
            setError('Chỉ chấp nhận email @vnpay.vn')
            return
        }

        setAdding(true)
        try {
            const derivedName = trimmed.split('@')[0]
            const { error: dbError } = await supabase
                .from('employees')
                .upsert(
                    [{ email: trimmed, full_name: derivedName, role: 'staff' }],
                    { onConflict: 'email', ignoreDuplicates: true }
                )

            if (dbError) {
                setError('Lỗi: ' + dbError.message)
                return
            }

            setSuccess(`✅ Đã thêm ${trimmed}`)
            setEmail('')
            onAdded?.()
        } catch (err) {
            setError('Lỗi: ' + err.message)
        } finally {
            setAdding(false)
        }
    }

    return (
        <div>
            <p className="text-sm text-tet-gold-light/80 mb-4">
                Thêm email mới vào danh sách được phép quay số.
            </p>
            <form onSubmit={handleAdd} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-tet-gold-light/80 mb-2">
                        📧 Email nhân viên
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ten@vnpay.vn"
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-tet-gold/20 text-tet-red-light placeholder-tet-red-light/30 focus:outline-none focus:border-tet-gold/60 focus:ring-2 focus:ring-tet-gold/20 transition-all"
                        required
                    />
                </div>
                {error && (
                    <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 rounded-xl bg-green-900/30 border border-green-500/30 text-green-300 text-sm">
                        {success}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={adding}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-surface bg-gradient-to-r from-tet-gold to-yellow-400 hover:from-yellow-400 hover:to-tet-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-tet-gold/20"
                >
                    {adding ? 'Đang thêm...' : '➕ Thêm Email'}
                </button>
            </form>
        </div>
    )
}

export default function AdminPage() {
    const { user } = useAuth()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('list') // 'list' | 'import' | 'add'
    const [msg, setMsg] = useState({ text: '', type: '' })
    const [historyEmp, setHistoryEmp] = useState(null)

    useEffect(() => {
        fetchEmployees()
    }, [])

    function showMsg(text, type = 'success') {
        setMsg({ text, type })
        setTimeout(() => setMsg({ text: '', type: '' }), 3000)
    }

    async function fetchEmployees() {
        setLoading(true)
        try {
            // Use SECURITY DEFINER functions to bypass RLS
            const { data: empData, error: empError } = await supabase.rpc('admin_list_employees')

            if (empError) {
                console.error('Error fetching employees:', empError)
                return
            }

            const { data: spinStats, error: statsError } = await supabase.rpc('admin_get_spin_stats')

            if (statsError) {
                console.error('Error fetching stats:', statsError)
            }

            const statsByEmail = {}
            if (spinStats) {
                spinStats.forEach(s => {
                    statsByEmail[s.email] = {
                        count: s.spin_count,
                        total: s.total_amount,
                        lastDate: s.last_spin_date,
                        phone: s.phone_number || '',
                    }
                })
            }

            const enriched = (empData || []).map(emp => ({
                ...emp,
                spin_count: statsByEmail[emp.email]?.count || 0,
                last_spin_date: statsByEmail[emp.email]?.lastDate || null,
                total_amount: statsByEmail[emp.email]?.total || 0,
                phone_number: statsByEmail[emp.email]?.phone || '',
            }))

            setEmployees(enriched)
        } finally {
            setLoading(false)
        }
    }

    async function handleReset(emp) {
        const today = getTodayBangkok()
        if (!window.confirm(`Reset lượt quay HÔM NAY của ${emp.full_name}?`)) return

        try {
            const { error } = await supabase.rpc('admin_reset_spin', {
                target_email: emp.email,
                target_date: today,
            })


            if (error) { showMsg(`❌ Lỗi: ${error.message}`, 'error'); return }

            showMsg(`✅ Đã reset lượt quay hôm nay của ${emp.full_name}`)
            fetchEmployees()
        } catch (err) {
            showMsg(`❌ ${err.message}`, 'error')
        }
    }

    async function handleResetAll(emp) {
        if (!window.confirm(`⚠️ XOÁ TOÀN BỘ lịch sử quay của ${emp.full_name}?\n\nHành động này không thể hoàn tác!`)) return

        try {
            const { error } = await supabase.rpc('admin_reset_spin', {
                target_email: emp.email,
            })

            if (error) { showMsg(`❌ Lỗi: ${error.message}`, 'error'); return }

            showMsg(`✅ Đã xoá toàn bộ lịch sử của ${emp.full_name}`)
            fetchEmployees()
        } catch (err) {
            showMsg(`❌ ${err.message}`, 'error')
        }
    }

    async function handleToggleRole(emp) {
        const newRole = emp.role === 'admin' ? 'staff' : 'admin'
        const label = newRole === 'admin' ? 'Admin' : 'Staff'
        if (!window.confirm(`Đổi quyền ${emp.full_name} thành ${label}?`)) return

        try {
            const { error } = await supabase.rpc('admin_update_role', {
                target_id: emp.id,
                new_role: newRole,
            })

            if (error) { showMsg(`❌ Lỗi: ${error.message}`, 'error'); return }

            showMsg(`✅ Đã đổi ${emp.full_name} thành ${label}`)
            fetchEmployees()
        } catch (err) {
            showMsg(`❌ ${err.message}`, 'error')
        }
    }

    async function handleDeleteUser(emp) {
        if (!window.confirm(`⚠️ XOÁ HOÀN TOÀN user "${emp.full_name}" (${emp.email})?\n\nHành động này sẽ xoá:\n- Tài khoản đăng nhập\n- Thông tin nhân viên\n- Lịch sử quay thưởng\n\nUser sẽ phải đăng ký lại từ đầu.`)) return

        try {
            const { error } = await supabase.rpc('admin_delete_user', {
                target_id: emp.id,
            })

            if (error) { showMsg(`❌ Lỗi: ${error.message}`, 'error'); return }

            showMsg(`✅ Đã xoá user ${emp.full_name}`)
            fetchEmployees()
        } catch (err) {
            showMsg(`❌ ${err.message}`, 'error')
        }
    }
    function exportCSV() {
        const headers = ['Email', 'Họ tên', 'Phòng ban', 'Mã NV', 'Vai trò', 'SĐT VNPAY', 'Số lần quay', 'Tổng nhận', 'Quay gần nhất', 'Đăng nhập gần nhất']
        const rows = employees.map(emp => [
            emp.email,
            emp.full_name,
            emp.department || '',
            emp.employee_code || '',
            emp.role,
            emp.phone_number || '',
            emp.spin_count || 0,
            emp.total_amount || 0,
            emp.last_spin_date ? formatDateVN(emp.last_spin_date) : '',
            emp.last_login_at ? formatDateTimeVN(emp.last_login_at) : 'Chưa',
        ])

        const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `lucky-draw-${getTodayBangkok()}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* History Modal */}
            {historyEmp && <HistoryModal emp={historyEmp} onClose={() => setHistoryEmp(null)} />}

            <div className="flex items-center justify-between mb-4 animate-fade-in-up">
                <h2 className="text-2xl font-bold font-[var(--font-display)] text-tet-gold-light">
                    👥 Quản lý
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchEmployees() }}
                        className="px-3 py-2 rounded-xl bg-surface border border-tet-gold/20 text-tet-gold text-sm hover:bg-surface-hover transition-colors"
                        title="Tải lại dữ liệu"
                    >
                        🔄
                    </button>
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 rounded-xl bg-surface border border-tet-gold/20 text-tet-gold text-sm hover:bg-surface-hover transition-colors"
                    >
                        📥 Xuất CSV
                    </button>
                </div>
            </div>

            {/* Stats */}
            <StatsPanel employees={employees} />

            {/* Tabs */}
            <div className="flex gap-2 mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'list'
                        ? 'bg-tet-gold/20 text-tet-gold border border-tet-gold/30'
                        : 'bg-surface/50 text-tet-pink/60 border border-transparent hover:bg-surface-hover'
                        }`}
                >
                    📋 Danh sách ({employees.length})
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'add'
                        ? 'bg-tet-gold/20 text-tet-gold border border-tet-gold/30'
                        : 'bg-surface/50 text-tet-pink/60 border border-transparent hover:bg-surface-hover'
                        }`}
                >
                    ➕ Thêm Email
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'import'
                        ? 'bg-tet-gold/20 text-tet-gold border border-tet-gold/30'
                        : 'bg-surface/50 text-tet-pink/60 border border-transparent hover:bg-surface-hover'
                        }`}
                >
                    📤 Import Excel
                </button>
            </div>

            {/* Message */}
            {msg.text && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${msg.type === 'error' ? 'bg-red-900/30 border border-red-500/30 text-red-300' : 'bg-green-900/30 border border-green-500/30 text-green-300'}`}>
                    {msg.text}
                </div>
            )}

            {/* Content */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {activeTab === 'list' ? (
                    <EmployeeList
                        employees={employees}
                        loading={loading}
                        onReset={handleReset}
                        onResetAll={handleResetAll}
                        onToggleRole={handleToggleRole}
                        onViewHistory={setHistoryEmp}
                        onDelete={handleDeleteUser}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                ) : activeTab === 'add' ? (
                    <AddEmailForm onAdded={fetchEmployees} />
                ) : (
                    <ExcelImport onImportDone={fetchEmployees} />
                )}
            </div>
        </div>
    )
}
