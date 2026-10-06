import {useState} from 'react'
import {NavLink,Outlet} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth'
import {RadrLogo} from '../components/RadrLogo'

const topNav=[
  ['/dashboard','Dashboard'],
  ['/radar','RADR'],
  ['/saved','Saved'],
  ['/applications','Applications'],
  ['/resume','Resume Studio'],
  ['/preferences','Preferences'],
] as const

export function DashboardLayout(){
  const{signOut}=useAuth()
  const[confirming,setConfirming]=useState(false)
  async function logout(){setConfirming(false);await signOut()}
  return <div className="appShell">
    <aside className="sidebar">
      <NavLink to="/dashboard" className="sidebarBrand" aria-label="RADR dashboard"><RadrLogo inverse/></NavLink>
      <nav className="sidebarNav" aria-label="Workspace">{topNav.map(([to,label])=><NavLink key={to} to={to}>{label}</NavLink>)}</nav>
      <nav className="sidebarUtility" aria-label="Account">
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <button type="button" onClick={()=>setConfirming(true)}>Logout</button>
      </nav>
    </aside>
    <main className="main"><Outlet/></main>
    {confirming&&<div className="modalBackdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)setConfirming(false)}}>
      <section className="logoutDialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <h2 id="logout-title">Sign out?</h2>
        <p>Your saved jobs, applications and documents will stay in your account.</p>
        <div className="dialogActions"><button className="btn secondary" type="button" onClick={()=>setConfirming(false)}>Cancel</button><button className="btn primary" type="button" onClick={()=>void logout()}>Sign out</button></div>
      </section>
    </div>}
  </div>
}
