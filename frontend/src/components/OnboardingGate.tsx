import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const [complete, setComplete] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setComplete(null)
      return
    }
    supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        setComplete(error ? false : Boolean(data?.onboarding_complete))
      })
    return () => { cancelled = true }
  }, [user])

  if (location.pathname === '/onboarding') return <>{children}</>
  if (complete === null) return <div className="center">Loading your profile…</div>
  if (!complete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}
