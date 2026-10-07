import {useMemo,useState} from 'react'
import {NavLink,Outlet} from 'react-router-dom'
import {Bookmark,BriefcaseBusiness,FileText,LayoutDashboard,LogOut,Radar,Settings,SlidersHorizontal,UserRound} from 'lucide-react'
import {useAuth} from '../hooks/useAuth'
import {RadrLogo} from '../components/RadrLogo'

const topNav=[
  {to:'/dashboard',label:'Dashboard',icon:LayoutDashboard},
  {to:'/radar',label:'RADR',icon:Radar},
  {to:'/saved',label:'Saved',icon:Bookmark},
  {to:'/applications',label:'Applications',icon:BriefcaseBusiness},
  {to:'/resume',label:'Resume Studio',icon:FileText},
  {to:'/preferences',label:'Preferences',icon:SlidersHorizontal},
] as const

const utilityNav=[
  {to:'/profile',label:'Profile',icon:UserRound},
  {to:'/settings',label:'Settings',icon:Settings},
] as const

export function DashboardLayout(){
  const{user,signOut}=useAuth()
  const[confirming,setConfirming]=useState(false)
  const initials=useMemo(()=>{
    const source=String(user?.user_metadata?.display_name||user?.email?.split('@')[0]||'R')
    return source.split(/\s+/).slice(0,2).map((part:string)=>part[0]?.toUpperCase()).join('')
  },[user])

  async function logout(){setConfirming(false);await signOut()}

  return <div className="appShell">
    <aside className="sidebar">
      <div className="sidebarTop">
        <NavLink to="/dashboard" className="sidebarBrand" aria-label="RADR dashboard"><RadrLogo inverse/></NavLink>
        <span className="sidebarLabel">Workspace</span>
        <nav className="sidebarNav" aria-label="Workspace">
          {topNav.map(({to,label,icon:Icon})=><NavLink key={to} to={to} title={label}><Icon size={17}/><span>{label}</span></NavLink>)}
        </nav>
      </div>

      <div className="sidebarBottom">
        <div className="sidebarAccount">
          <span className="sidebarAvatar">{initials}</span>
          <div><b>{user?.user_metadata?.display_name||'Your account'}</b><span>{user?.email||''}</span></div>
        </div>
        <nav className="sidebarUtility" aria-label="Account">
          {utilityNav.map(({to,label,icon:Icon})=><NavLink key={to} to={to} title={label}><Icon size={17}/><span>{label}</span></NavLink>)}
          <button type="button" onClick={()=>setConfirming(true)}><LogOut size={17}/><span>Sign out</span></button>
        </nav>
      </div>
    </aside>

    <main className="main"><Outlet/></main>

    {confirming&&<div className="modalBackdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)setConfirming(false)}}>
      <section className="logoutDialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <div className="dialogIcon"><LogOut size={19}/></div>
        <h2 id="logout-title">Sign out?</h2>
        <p>Your saved jobs, applications and documents will stay in your account.</p>
        <div className="dialogActions">
          <button className="btn secondary" type="button" onClick={()=>setConfirming(false)}>Cancel</button>
          <button className="btn primary" type="button" onClick={()=>void logout()}>Sign out</button>
        </div>
      </section>
    </div>}
  </div>
}
