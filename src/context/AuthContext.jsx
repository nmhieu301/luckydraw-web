import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
    const initRef = useRef(false)

    useEffect(() => {
        // Safety timeout
        const safetyTimer = setTimeout(() => setLoading(false), 6000)

        // Listen for ALL auth changes including INITIAL_SESSION
        // With flowType: 'implicit' + detectSessionInUrl: true,
        // Supabase auto-processes #access_token from magic link
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('Auth event:', event, newSession?.user?.email)

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
    }, [])

    async function fetchEmployee(authUser) {
        if (fetchingRef.current) return
        fetchingRef.current = true

        try {
            console.log('Registering/fetching employee for:', authUser.email)

            // Auto-register: creates employee if not exists, updates login if exists
            const { data, error } = await supabase.rpc('auto_register_employee')

            console.log('Employee result:', data, error)

            if (error) {
                console.error('Error registering employee:', error)
                setEmployee(null)
            } else if (!data || data.length === 0) {
                console.log('No employee record returned')
                setEmployee(null)
            } else {
                const emp = data[0]
                setEmployee(emp)
                console.log('Employee role:', emp.role, 'isAdmin:', emp.role === 'admin')
            }
        } catch (err) {
            console.error('Error in fetchEmployee:', err)
            setEmployee(null)
        } finally {
            fetchingRef.current = false
            setLoading(false)
        }
    }

    async function signOut() {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setEmployee(null)
    }

    const isAdmin = employee?.role === 'admin'

    const value = {
        session,
        user,
        employee,
        isAdmin,
        loading,
        signOut,
        refreshEmployee: async () => {
            if (user) {
                fetchingRef.current = false
                await fetchEmployee(user)
            }
        },
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
