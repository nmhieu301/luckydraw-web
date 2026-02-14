import { createContext, useContext, useEffect, useState } from 'react'
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

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchEmployee(session.user)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchEmployee(session.user)
                } else {
                    setEmployee(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchEmployee(authUser) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('email', authUser.email)
                .single()

            if (error && error.code === 'PGRST116') {
                // No employee record found — this is a new user
                setEmployee(null)
            } else if (error) {
                console.error('Error fetching employee:', error)
                setEmployee(null)
            } else {
                // Update last_login_at and auth_user_id first
                await supabase
                    .from('employees')
                    .update({
                        last_login_at: new Date().toISOString(),
                        auth_user_id: authUser.id
                    })
                    .eq('id', data.id)

                // Re-fetch to get the most up-to-date employee data
                const { data: refreshed } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('id', data.id)
                    .single()

                setEmployee(refreshed || data)
            }
        } catch (err) {
            console.error('Error in fetchEmployee:', err)
            setEmployee(null)
        } finally {
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
