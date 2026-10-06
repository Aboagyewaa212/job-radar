import {useState} from 'react'
import {Link} from 'react-router-dom'

export default function SettingsPage(){
  const[reducedMotion,setReducedMotion]=useState(false)
  return <><header className="pageHeader cleanHeader"><h1>Settings</h1></header>
    <section className="settingsRows">
      <div><b>Appearance</b><label className="inlineControl"><input type="checkbox" checked={reducedMotion} onChange={e=>setReducedMotion(e.target.checked)}/> Reduce motion</label></div>
      <div><b>Privacy</b><span>Your uploaded CV is private to your account.</span></div>
      <div><b>Security</b><span>Password and session controls are handled through your account sign-in.</span></div>
      <div><b>Data</b><span>Your saved applications and generated documents remain attached to your account.</span></div>
      <div><b>Legal</b><span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/accessibility">Accessibility</Link></span></div>
    </section></>
}
