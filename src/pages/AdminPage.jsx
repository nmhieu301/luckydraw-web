import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateVN, formatDateTimeVN, isValidVnpayEmail, getTodayBangkok } from '../lib/utils'
import * as XLSX from 'xlsx'

function EmployeeList({ employees, loading, onReset, searchTerm, setSearchTerm }) {
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
                    {filtered.map(emp => (
                        <div key={emp.id} className="glass-card p-4 hover:border-tet-gold/30 transition-colors">
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
                                            Quay: {emp.spin_count || 0} lần
                                        </span>
                                        {emp.last_spin_date && (
                                            <span className="text-xs text-tet-pink/40">
                                                Gần nhất: {formatDateVN(emp.last_spin_date)}
                                            </span>
                                        )}
                                        {emp.last_login_at && (
                                            <span className="text-xs text-green-400/60">
                                                ✓ Đã đăng nhập
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onReset(emp)}
                                    className="px-3 py-1.5 rounded-lg bg-tet-red/20 border border-tet-red/30 text-tet-red-light text-xs hover:bg-tet-red/30 transition-colors shrink-0"
                                    title="Reset lượt quay hôm nay"
                                >
                                    🔄 Reset
                                </button>
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
                    const email = (row.email || row.Email || row.EMAIL || '').toString().trim().toLowerCase()
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
                    if (!fullName) {
                        errs.push({ row: idx + 2, message: `Thiếu họ tên cho email: ${email}` })
                        return
                    }

                    rows.push({ email, full_name: fullName, department, employee_code: employeeCode || null })
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

            {/* Errors */}
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

            {/* Preview */}
            {preview.length > 0 && !imported && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-tet-gold-light font-medium">
                            Xem trước ({preview.length} nhân viên hợp lệ)
                        </p>
                    </div>
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

            {/* Success */}
            {imported && (
                <div className="p-4 rounded-xl bg-green-900/30 border border-green-500/30 text-green-300 text-sm text-center">
                    ✅ Đã import thành công {preview.length} nhân viên!
                </div>
            )}
        </div>
    )
}

export default function AdminPage() {
    const { user } = useAuth()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('list') // 'list' | 'import'
    const [resetMsg, setResetMsg] = useState('')

    useEffect(() => {
        fetchEmployees()
    }, [])

    async function fetchEmployees() {
        setLoading(true)
        try {
            // Get employees with spin stats
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching employees:', error)
                return
            }

            // Fetch spin stats for all employees  
            const { data: spinStats } = await supabase
                .from('lucky_draw_results')
                .select('email, draw_date, amount')
                .order('draw_date', { ascending: false })

            const statsByEmail = {}
            if (spinStats) {
                spinStats.forEach(s => {
                    if (!statsByEmail[s.email]) {
                        statsByEmail[s.email] = { count: 0, lastDate: null }
                    }
                    statsByEmail[s.email].count++
                    if (!statsByEmail[s.email].lastDate) {
                        statsByEmail[s.email].lastDate = s.draw_date
                    }
                })
            }

            const enriched = (data || []).map(emp => ({
                ...emp,
                spin_count: statsByEmail[emp.email]?.count || 0,
                last_spin_date: statsByEmail[emp.email]?.lastDate || null,
            }))

            setEmployees(enriched)
        } finally {
            setLoading(false)
        }
    }

    async function handleReset(emp) {
        const today = getTodayBangkok()
        const confirmed = window.confirm(`Bạn có chắc muốn reset lượt quay hôm nay của ${emp.full_name}?`)
        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('lucky_draw_results')
                .delete()
                .eq('email', emp.email)
                .eq('draw_date', today)

            if (error) {
                setResetMsg(`❌ Lỗi: ${error.message}`)
                return
            }

            // Log the audit
            await supabase.from('audit_logs').insert({
                actor_user_id: user.id,
                action: 'reset_spin',
                payload_json: { target_email: emp.email, date: today },
            })

            setResetMsg(`✅ Đã reset lượt quay của ${emp.full_name}`)
            setTimeout(() => setResetMsg(''), 3000)
            fetchEmployees()
        } catch (err) {
            setResetMsg(`❌ Lỗi: ${err.message}`)
        }
    }

    function exportCSV() {
        const headers = ['Email', 'Họ tên', 'Phòng ban', 'Mã NV', 'Vai trò', 'Số lần quay', 'Quay gần nhất', 'Đăng nhập gần nhất']
        const rows = employees.map(emp => [
            emp.email,
            emp.full_name,
            emp.department || '',
            emp.employee_code || '',
            emp.role,
            emp.spin_count || 0,
            emp.last_spin_date ? formatDateVN(emp.last_spin_date) : '',
            emp.last_login_at ? formatDateTimeVN(emp.last_login_at) : 'Chưa',
        ])

        const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `nhan-vien-lucky-draw-${getTodayBangkok()}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold font-[var(--font-display)] text-tet-gold-light">
                    👥 Quản lý nhân viên
                </h2>
                <button
                    onClick={exportCSV}
                    className="px-4 py-2 rounded-xl bg-surface border border-tet-gold/20 text-tet-gold text-sm hover:bg-surface-hover transition-colors"
                >
                    📥 Xuất CSV
                </button>
            </div>

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
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'import'
                            ? 'bg-tet-gold/20 text-tet-gold border border-tet-gold/30'
                            : 'bg-surface/50 text-tet-pink/60 border border-transparent hover:bg-surface-hover'
                        }`}
                >
                    📤 Import Excel
                </button>
            </div>

            {/* Reset message */}
            {resetMsg && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${resetMsg.startsWith('✅') ? 'bg-green-900/30 border border-green-500/30 text-green-300' : 'bg-red-900/30 border border-red-500/30 text-red-300'
                    }`}>
                    {resetMsg}
                </div>
            )}

            {/* Content */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {activeTab === 'list' ? (
                    <EmployeeList
                        employees={employees}
                        loading={loading}
                        onReset={handleReset}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                ) : (
                    <ExcelImport onImportDone={fetchEmployees} />
                )}
            </div>
        </div>
    )
}
