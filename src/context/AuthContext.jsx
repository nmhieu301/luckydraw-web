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

    useEffect(() => {
        // Safety timeout - never stay loading > 6s
        const safetyTimer = setTimeout(() => {
            setLoading(false)
        }, 6000)

        async function initAuth() {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()

                if (currentSession?.user) {
                    setSession(currentSession)
                    setUser(currentSession.user)
                    await fetchEmployee(currentSession.user)
                } else {
                    setLoading(false)
                }
            } catch (err) {
                console.error('Init auth error:', err)
                setLoading(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('Auth event:', event)

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (newSession?.user) {
                        setSession(newSession)
                        setUser(newSession.user)
                        await fetchEmployee(newSession.user)
                    }
                } else if (event === 'SIGNED_OUT') {
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
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('email', authUser.email)
                .maybeSingle()

            if (error) {
                console.error('Error fetching employee:', error)
                setEmployee(null)
            } else if (!data) {
                // No employee record - new user
                setEmployee(null)
            } else {
                // Set employee immediately with the data we have
                setEmployee(data)

                // Update auth_user_id + last_login in background (don't await)
                supabase
                    .from('employees')
                    .update({
                        last_login_at: new Date().toISOString(),
                        auth_user_id: authUser.id
                    })
                    .eq('id', data.id)
                    .then(() => {
                        console.log('Employee linked & login updated')
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
        refreshEmployee: () => user && fetchEmployee(user),
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
