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
            console.log('Fetching employee for:', authUser.email)

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('email', authUser.email)
                .maybeSingle()

            console.log('Employee result:', data, error)

            if (error) {
                console.error('Error fetching employee:', error)
                setEmployee(null)
            } else if (!data) {
                setEmployee(null)
            } else {
                setEmployee(data)
                console.log('Employee role:', data.role, 'isAdmin:', data.role === 'admin')

                // Update auth link in background
                supabase
                    .from('employees')
                    .update({
                        last_login_at: new Date().toISOString(),
                        auth_user_id: authUser.id
                    })
                    .eq('id', data.id)
                    .then(({ error: updateErr }) => {
                        if (updateErr) console.error('Update link error:', updateErr)
                    })
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
