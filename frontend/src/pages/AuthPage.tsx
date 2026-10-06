import {FormEvent,useEffect,useRef,useState} from 'react'
import {Link,Navigate,useNavigate,useSearchParams} from 'react-router-dom'
import {supabase} from '../services/supabase'
import {useAuth} from '../hooks/useAuth'
import {RadrLogo} from '../components/RadrLogo'

const strongPassword=(value:string)=>value.length>=8&&/[a-z]/.test(value)&&/[A-Z]/.test(value)&&/\d/.test(value)&&/[^A-Za-z0-9]/.test(value)

type Mode='signup'|'login'|'forgot'|'reset-password'

export default function AuthPage(){
  const{user}=useAuth();const nav=useNavigate();const[params]=useSearchParams()
  const rawMode=params.get('mode')
  const initial:Mode=rawMode==='login'||rawMode==='forgot'||rawMode==='reset-password'?rawMode:'signup'
  const promptLogin=params.get('prompt')==='1',cleared=useRef(false)
  const[mode,setMode]=useState<Mode>(initial)
  const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[confirmPassword,setConfirmPassword]=useState('');const[name,setName]=useState('');const[consent,setConsent]=useState(false);const[error,setError]=useState('');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false)
  const[recoveryReady,setRecoveryReady]=useState<boolean|null>(initial==='reset-password'?null:true)

  useEffect(()=>{if(!promptLogin||cleared.current)return;cleared.current=true;void supabase.auth.getSession().then(({data})=>{if(data.session)void supabase.auth.signOut({scope:'local'})})},[promptLogin])

  useEffect(()=>{
    if(mode!=='reset-password'){setRecoveryReady(true);return}
    let active=true
    void supabase.auth.getSession().then(({data})=>{if(active)setRecoveryReady(Boolean(data.session))})
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(!active)return
      if(event==='PASSWORD_RECOVERY'||session)setRecoveryReady(true)
      if(event==='SIGNED_OUT')setRecoveryReady(false)
    })
    return()=>{active=false;subscription.unsubscribe()}
  },[mode])

  if(user&&!promptLogin&&mode!=='reset-password')return <Navigate to="/dashboard" replace/>
  if(user&&promptLogin&&!cleared.current)return <main className="authPage"><section className="authBrand"><RadrLogo inverse/><div className="authBrandMessage"><h1>One moment.</h1><p>Preparing a fresh sign-in for this browser.</p></div></section><section className="authFormPane"><p>Signing out of the current session…</p></section></main>

  async function submit(e:FormEvent){
    e.preventDefault();setError('');setMessage('')
    if(mode==='forgot'){
      setBusy(true)
      const redirectTo=`${window.location.origin}/auth?mode=reset-password`
      const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo})
      setBusy(false)
      if(error){setError(error.message);return}
      setMessage('Password reset link sent. Check your email.')
      return
    }
    if(mode==='reset-password'){
      if(!strongPassword(password)){setError('Use at least 8 characters with uppercase, lowercase, a number, and a symbol.');return}
      if(password!==confirmPassword){setError('Passwords do not match.');return}
      setBusy(true)
      const{data:{session}}=await supabase.auth.getSession()
      if(!session){setBusy(false);setRecoveryReady(false);setError('This reset link is no longer active. Request a new password reset email.');return}
      const{error}=await supabase.auth.updateUser({password})
      setBusy(false)
      if(error){setError(error.message);return}
      setMessage('Password updated. You can continue to your dashboard.')
      return
    }
    if(mode==='signup'&&!consent){setError('Please accept the Terms and Privacy Policy to create an account.');return}
    if(mode==='signup'&&!strongPassword(password)){setError('Use at least 8 characters with uppercase, lowercase, a number, and a symbol.');return}
    setBusy(true)
    try{
      if(mode==='signup'){
        const{data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}})
        if(error)throw error
        if(data.session)nav('/onboarding');else setMessage('Check your email to confirm your account, then sign in.')
      }else{
        const{error}=await supabase.auth.signInWithPassword({email,password})
        if(error)throw error
        nav('/dashboard')
      }
    }catch(e){setError(e instanceof Error?e.message:'Authentication failed')}finally{setBusy(false)}
  }

  const title=mode==='signup'?'Create account':mode==='login'?'Sign in':mode==='forgot'?'Reset password':'Choose a new password'
  const brandTitle=mode==='signup'?'Start with what you already have.':mode==='login'?'Back on your RADR.':'Get back into your RADR.'
  const brandCopy=mode==='signup'?'Your CV becomes the signal for what appears next.':mode==='login'?'Pick up where you left off.':'Reset your password securely and continue where you left off.'

  return <main className="authPage">
    <section className="authBrand"><Link to="/" className="authLogo"><RadrLogo inverse/></Link><div className="authBrandMessage"><h1>{brandTitle}</h1><p>{brandCopy}</p></div></section>
    <section className="authFormPane">
      {(mode==='signup'||mode==='login')&&<div className="authMode"><button type="button" className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setError('');setMessage('')}}>Create account</button><button type="button" className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');setMessage('')}}>Sign in</button></div>}
      <h2>{title}</h2>
      <form onSubmit={submit} className="stack">
        {mode==='signup'&&<label>Name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label>}
        {mode!=='reset-password'&&<label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>}
        {mode==='reset-password'&&recoveryReady===null&&<p className="status" role="status">Verifying your reset link…</p>}
        {mode==='reset-password'&&recoveryReady===false&&<div className="stack"><p className="error" role="alert">This reset link is no longer active. It may have expired, been used already, or the recovery session was cleared.</p><button className="btn secondary" type="button" onClick={()=>{setMode('forgot');setError('');setMessage('');setPassword('');setConfirmPassword('')}}>Request a new reset link</button></div>}
        {(mode==='signup'||mode==='login'||(mode==='reset-password'&&recoveryReady===true))&&<label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==='login'?1:8} required/>{mode!=='login'&&<small className="finePrint">At least 8 characters with uppercase, lowercase, a number, and a symbol.</small>}</label>}
        {mode==='reset-password'&&recoveryReady===true&&<label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={8} required/></label>}
        {mode==='signup'&&<label className="consentRow"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span></label>}
        {mode==='login'&&<button className="forgotLink" type="button" onClick={()=>{setMode('forgot');setError('');setMessage('')}}>Forgot password?</button>}
        {error&&(mode!=='reset-password'||recoveryReady===true)&&<p className="error" role="alert">{error}</p>}
        {message&&<p className="status" role="status">{message}</p>}
        {(mode!=='reset-password'||recoveryReady===true)&&<button className="btn primary authSubmit" disabled={busy||recoveryReady===null}>{busy?'Working…':mode==='signup'?'Create account':mode==='login'?'Sign in':mode==='forgot'?'Send reset link':'Update password'}</button>}
        {mode==='forgot'&&<button className="textButton" type="button" onClick={()=>setMode('login')}>Back to sign in</button>}
        {mode==='reset-password'&&message&&<button className="textButton" type="button" onClick={()=>nav('/dashboard')}>Continue to dashboard</button>}
      </form>
    </section>
  </main>
}
