import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'

const REDUCED_MOTION_KEY='job-radar-reduced-motion'

export default function SettingsPage(){
  const[reducedMotion,setReducedMotion]=useState(()=>localStorage.getItem(REDUCED_MOTION_KEY)==='true')

  useEffect(()=>{
    document.documentElement.classList.toggle('reduceMotion',reducedMotion)
    localStorage.setItem(REDUCED_MOTION_KEY,String(reducedMotion))
  },[reducedMotion])

  return <><header className="pageHeader cleanHeader"><h1>Settings</h1></header>
    <section className="settingsRows">
      <div><b>Appearance</b><label className="inlineControl"><input type="checkbox" checked={reducedMotion} onChange={e=>setReducedMotion(e.target.checked)}/> Reduce motion and interface transitions</label></div>
      <div><b>Privacy</b><span>Your uploaded CV is private to your account.</span></div>
      <div><b>Security</b><span>Password and session controls are handled through your account sign-in.</span></div>
      <div><b>Data</b><span>Your saved applications and generated documents remain attached to your account.</span></div>
      <div><b>Legal</b><span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/accessibility">Accessibility</Link></span></div>
    </section></>
}
