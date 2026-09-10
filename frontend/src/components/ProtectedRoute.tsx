import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
export function ProtectedRoute({children}:{children:React.ReactNode}){const{user,loading}=useAuth();if(loading)return <div className="center">Loading…</div>;if(!user)return <Navigate to="/auth" replace/>;return <>{children}</>}
