import { NavLink, Outlet } from 'react-router-dom'
import { Bookmark, BriefcaseBusiness, FileText, LogOut, Radar, Settings, UserRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function DashboardLayout(){
  const {user,signOut}=useAuth(); const name=(user?.user_metadata?.display_name as string)||user?.email?.split('@')[0]||'Job seeker'
  return <div className="appShell"><aside className="sidebar"><div className="brand"><span className="brandMark">J</span><div><b>Job Radar</b><small>CAREER INTELLIGENCE</small></div></div><nav>
    <NavLink to="/radar"><Radar size={17}/>Radar</NavLink><NavLink to="/saved"><Bookmark size={17}/>Saved</NavLink><NavLink to="/applications"><BriefcaseBusiness size={17}/>Applications</NavLink><NavLink to="/resume"><FileText size={17}/>Resume Studio</NavLink><NavLink to="/preferences"><Settings size={17}/>Preferences</NavLink><NavLink to="/profile"><UserRound size={17}/>Profile</NavLink>
  </nav><div className="sidebarFoot"><div className="avatar">{name.slice(0,2).toUpperCase()}</div><div className="userMeta"><b>{name}</b><small>{user?.email}</small></div><button className="iconButton" onClick={()=>void signOut()} aria-label="Sign out"><LogOut size={16}/></button></div></aside><main className="main"><Outlet/></main></div>
}
