import {FormEvent,useEffect,useRef,useState} from 'react'
import {Link,Navigate,useNavigate,useSearchParams} from 'react-router-dom'
import {supabase} from '../services/supabase'
import {useAuth} from '../hooks/useAuth'
import {RadrLogo} from '../components/RadrLogo'

const strongPassword=(value:string)=>value.length>=12&&/[a-z]/.test(value)&&/[A-Z]/.test(value)&&/\d/.test(value)&&/[^A-Za-z0-9]/.test(value)

export default function AuthPage(){
  const{user}=useAuth();const nav=useNavigate();const[params]=useSearchParams()
  const initial=params.get('mode')==='login'?'login':'signup',promptLogin=params.get('prompt')==='1',cleared=useRef(false)
  const[mode,setMode]=useState<'signup'|'login'>(initial);const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[name,setName]=useState('');const[consent,setConsent]=useState(false);const[error,setError]=useState('');const[busy,setBusy]=useState(false)
  useEffect(()=>{if(promptLogin&&user&&!cleared.current){cleared.current=true;void supabase.auth.signOut({scope:'local'})}},[promptLogin,user])
  if(user&&!promptLogin)return <Navigate to="/dashboard" replace/>
  if(user&&promptLogin)return <main className="authPage"><section className="authBrand"><RadrLogo inverse/><div className="authBrandMessage"><h1>One moment.</h1><p>Preparing a fresh sign-in for this browser.</p></div></section><section className="authFormPane"><p>Signing out of the current session…</p></section></main>
  async function submit(e:FormEvent){e.preventDefault();if(mode==='signup'&&!consent){setError('Please accept the Terms and Privacy Policy to create an account.');return}if(mode==='signup'&&!strongPassword(password)){setError('Use at least 12 characters with uppercase, lowercase, a number, and a symbol.');return}setBusy(true);setError('');try{if(mode==='signup'){const{data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});if(error)throw error;if(data.session)nav('/onboarding');else setError('Check your email to confirm your account, then sign in.')}else{const{error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;nav('/dashboard')}}catch(e){setError(e instanceof Error?e.message:'Authentication failed')}finally{setBusy(false)}}
  return <main className="authPage">
    <section className="authBrand"><Link to="/" className="authLogo"><RadrLogo inverse/></Link><div className="authBrandMessage"><h1>{mode==='login'?'Back on your RADR.':'Start with what you already have.'}</h1><p>{mode==='login'?'Pick up where you left off.':'Your CV becomes the signal for what appears next.'}</p></div></section>
    <section className="authFormPane">
      <div className="authMode"><button type="button" className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>Create account</button><button type="button" className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Sign in</button></div>
      <h2>{mode==='signup'?'Create account':'Sign in'}</h2>
      <form onSubmit={submit} className="stack">{mode==='signup'&&<label>Name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label>}<label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==='signup'?12:1} required/>{mode==='signup'&&<small className="finePrint">12+ characters with uppercase, lowercase, a number, and a symbol.</small>}</label>{mode==='signup'&&<label className="consentRow"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span></label>}{error&&<p className="error" role="alert">{error}</p>}<button className="btn primary authSubmit" disabled={busy}>{busy?'Working…':mode==='signup'?'Create account':'Sign in'}</button></form>
    </section>
  </main>
}
