import {useEffect,useState} from 'react'
import {Download,Eye,FileText,KeyRound,LockKeyhole,LogOut,Scale,ShieldCheck} from 'lucide-react'
import {Link} from 'react-router-dom'
import {supabase} from '../services/supabase'
import {useAuth} from '../hooks/useAuth'

const REDUCED_MOTION_KEY='job-radar-reduced-motion'

export default function SettingsPage(){
  const{user}=useAuth()
  const[reducedMotion,setReducedMotion]=useState(()=>localStorage.getItem(REDUCED_MOTION_KEY)==='true')
  const[busy,setBusy]=useState('')
  const[message,setMessage]=useState('')
  const[error,setError]=useState('')

  useEffect(()=>{
    document.documentElement.classList.toggle('reduceMotion',reducedMotion)
    localStorage.setItem(REDUCED_MOTION_KEY,String(reducedMotion))
  },[reducedMotion])

  async function sendPasswordReset(){
    if(!user?.email||busy)return
    setBusy('password');setMessage('');setError('')
    const redirectTo=`${window.location.origin}/auth?mode=reset-password`
    const{error}=await supabase.auth.resetPasswordForEmail(user.email,{redirectTo})
    setBusy('')
    if(error){setError(error.message);return}
    setMessage('Password reset email sent.')
  }

  async function signOutEverywhere(){
    if(busy)return
    const confirmed=window.confirm('Sign out of Job RADR on all devices?')
    if(!confirmed)return
    setBusy('sessions');setMessage('');setError('')
    const{error}=await supabase.auth.signOut({scope:'global'})
    setBusy('')
    if(error){setError(error.message);return}
    window.location.assign('/')
  }

  async function downloadData(){
    if(!user||busy)return
    setBusy('export');setMessage('');setError('')
    try{
      const [profile,preferences,resumes,progress,matches,tailored,letters]=await Promise.all([
        supabase.from('profiles').select('*').eq('user_id',user.id).maybeSingle(),
        supabase.from('preferences').select('*').eq('user_id',user.id).maybeSingle(),
        supabase.from('user_resumes').select('id,original_filename,content_type,is_primary,created_at,updated_at').eq('user_id',user.id),
        supabase.from('application_progress').select('*').eq('user_id',user.id),
        supabase.from('user_job_matches').select('*').eq('user_id',user.id),
        supabase.from('tailored_resumes').select('*').eq('user_id',user.id),
        supabase.from('cover_letters').select('*').eq('user_id',user.id),
      ])
      const failed=[profile,preferences,resumes,progress,matches,tailored,letters].find(result=>result.error)
      if(failed?.error)throw failed.error
      const payload={
        exported_at:new Date().toISOString(),
        account:{id:user.id,email:user.email,created_at:user.created_at},
        profile:profile.data,
        preferences:preferences.data,
        resumes:resumes.data,
        application_progress:progress.data,
        job_matches:matches.data,
        tailored_resumes:tailored.data,
        cover_letters:letters.data,
      }
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url
      a.download=`job-radr-data-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Data export downloaded.')
    }catch(error){
      setError(error instanceof Error?error.message:'Could not export your data')
    }finally{
      setBusy('')
    }
  }

  return <>
    <header className="pageHeader cleanHeader"><h1>Settings</h1></header>

    <div className="settingsPage">
      <section className="settingsSection">
        <div className="settingsSectionTitle"><LockKeyhole size={18}/><h2>Account & security</h2></div>
        <div className="settingsList">
          <div className="settingsItem">
            <div><b>Email</b><span>{user?.email||'—'}</span></div>
          </div>
          <div className="settingsItem">
            <div><b>Password</b><span>Send a secure reset link to your email.</span></div>
            <button className="btn secondary" type="button" disabled={busy==='password'} onClick={()=>void sendPasswordReset()}>
              <KeyRound size={15}/>{busy==='password'?'Sending…':'Reset password'}
            </button>
          </div>
          <div className="settingsItem">
            <div><b>Active sessions</b><span>Sign out of Job RADR everywhere.</span></div>
            <button className="btn secondary" type="button" disabled={busy==='sessions'} onClick={()=>void signOutEverywhere()}>
              <LogOut size={15}/>Sign out all devices
            </button>
          </div>
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsSectionTitle"><Eye size={18}/><h2>Appearance & accessibility</h2></div>
        <div className="settingsList">
          <label className="settingsToggle">
            <div><b>Reduce motion</b><span>Turn off interface animations and transitions.</span></div>
            <input type="checkbox" checked={reducedMotion} onChange={e=>setReducedMotion(e.target.checked)}/>
          </label>
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsSectionTitle"><ShieldCheck size={18}/><h2>Data & privacy</h2></div>
        <div className="settingsList">
          <div className="settingsItem">
            <div><b>Download my data</b><span>Export your profile, preferences, matches, applications and generated documents.</span></div>
            <button className="btn secondary" type="button" disabled={busy==='export'} onClick={()=>void downloadData()}>
              <Download size={15}/>{busy==='export'?'Preparing…':'Download data'}
            </button>
          </div>
          <div className="settingsItem">
            <div><b>CV privacy</b><span>Your uploaded CV is stored privately and is only available to your account.</span></div>
            <Link className="settingsLink" to="/privacy">Privacy policy</Link>
          </div>
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsSectionTitle"><Scale size={18}/><h2>Legal</h2></div>
        <div className="settingsLegalGrid">
          <Link to="/privacy"><FileText size={16}/><span>Privacy</span></Link>
          <Link to="/terms"><FileText size={16}/><span>Terms</span></Link>
          <Link to="/cookies"><FileText size={16}/><span>Cookies</span></Link>
          <Link to="/accessibility"><FileText size={16}/><span>Accessibility</span></Link>
        </div>
      </section>

      {message&&<div className="settingsMessage" role="status">{message}</div>}
      {error&&<div className="studioError" role="alert">{error}</div>}
    </div>
  </>
}
