import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [employee, setEmployee] = useState(null)
    const [loading, setLoading] = useState(true)
    const fetchingRef = useRef(false)

    const fetchEmployee = useCallback(async (authUser) => {
        if (fetchingRef.current) return
        fetchingRef.current = true

        try {
            const { data, error } = await supabase.rpc('auto_register_employee')

            if (error) {
                setEmployee(null)
            } else if (!data || data.length === 0) {
                setEmployee(null)
            } else {
                setEmployee(data[0])
            }
        } catch {
            setEmployee(null)
        } finally {
            fetchingRef.current = false
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const safetyTimer = setTimeout(() => setLoading(false), 6000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (newSession?.user) {
                    setSession(newSession)
                    setUser(newSession.user)
                    await fetchEmployee(newSession.user)
                } else {
                    setSession(null)
                    setUser(null)
                    setEmployee(null)
                    setLoading(false)
                }
            }
        )

        return () => {
            clearTimeout(safetyTimer)
            subscription.unsubscribe()
        }
    }, [fetchEmployee])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setEmployee(null)
    }, [])

    const refreshEmployee = useCallback(async () => {
        if (user) {
            fetchingRef.current = false
            await fetchEmployee(user)
        }
    }, [user, fetchEmployee])

    const isAdmin = employee?.role === 'admin'

    const value = useMemo(() => ({
        session,
        user,
        employee,
        isAdmin,
        loading,
        signOut,
        refreshEmployee,
    }), [session, user, employee, isAdmin, loading, signOut, refreshEmployee])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
