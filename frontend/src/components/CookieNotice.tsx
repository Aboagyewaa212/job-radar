import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function CookieNotice(){const[visible,setVisible]=useState(false);useEffect(()=>{setVisible(localStorage.getItem('job-radar-storage-notice')!=='acknowledged')},[]);if(!visible)return null;return <aside className="cookieNotice" role="dialog" aria-label="Storage notice"><div><b>Essential browser storage only</b><p>Job Radar currently uses storage needed for sign-in and this notice. No advertising or analytics cookies are enabled.</p></div><div className="cookieActions"><Link to="/cookies">Read policy</Link><button className="btn primary" onClick={()=>{localStorage.setItem('job-radar-storage-notice','acknowledged');setVisible(false)}}>Got it</button></div></aside>}
