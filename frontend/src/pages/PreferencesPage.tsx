import {useEffect,useState} from 'react'
import {supabase} from '../services/supabase'
import {useAuth} from '../hooks/useAuth'

const list=(s:string)=>s.split(',').map(v=>v.trim()).filter(Boolean)

export default function PreferencesPage(){
  const{user}=useAuth()
  const[roles,setRoles]=useState('')
  const[sources,setSources]=useState('')
  const[excluded,setExcluded]=useState('')
  const[minFit,setMinFit]=useState(60)
  const[threshold,setThreshold]=useState(90)
  const[remoteOnly,setRemoteOnly]=useState(true)
  const[status,setStatus]=useState('')
  const[saving,setSaving]=useState(false)

  useEffect(()=>{
    if(!user)return
    supabase.from('preferences').select('*').eq('user_id',user.id).single().then(({data})=>{
      if(!data)return
      setRoles((data.target_roles||[]).join(', '))
      setSources((data.preferred_sources||[]).join(', '))
      setExcluded((data.excluded_keywords||[]).join(', '))
      setMinFit(data.minimum_fit_score)
      setThreshold(data.strong_match_threshold)
      setRemoteOnly(data.remote_only)
    })
  },[user])

  async function save(){
    if(!user||saving)return
    setSaving(true)
    setStatus('')
    try{
      const strongThreshold=Math.max(minFit,threshold)
      const{error}=await supabase.from('preferences').update({
        target_roles:list(roles),
        preferred_sources:list(sources),
        excluded_keywords:list(excluded),
        minimum_fit_score:minFit,
        strong_match_threshold:strongThreshold,
        notification_strong_matches:false,
        remote_only:remoteOnly,
        updated_at:new Date().toISOString(),
      }).eq('user_id',user.id)
      if(error)throw error
      if(strongThreshold!==threshold)setThreshold(strongThreshold)

      const{data,error:matchError}=await supabase.functions.invoke('match-user-jobs',{body:{}})
      if(matchError)throw matchError
      if(typeof data?.matched!=='number')throw new Error('RADR refresh did not complete')
    }catch(error){
      setStatus(error instanceof Error?error.message:'Could not save preferences')
    }finally{
      setSaving(false)
    }
  }

  return <>
    <header className="pageHeader cleanHeader"><h1>Preferences</h1></header>
    <section className="settingsGrid">
      <div className="panel stack">
        <h2>Search rules</h2>
        <label>Target roles<input value={roles} onChange={e=>setRoles(e.target.value)} placeholder="Frontend Developer, Project Coordinator…"/></label>
        <label>Preferred sources<input value={sources} onChange={e=>setSources(e.target.value)} placeholder="Leave blank for all enabled sources"/></label>
        <p className="finePrint">Leave preferred sources blank to search every enabled source.</p>
        <label>Exclude keywords<input value={excluded} onChange={e=>setExcluded(e.target.value)} placeholder="senior only, onsite…"/></label>
        <label className="check"><input type="checkbox" checked={remoteOnly} onChange={e=>setRemoteOnly(e.target.checked)}/> Only show fully remote roles</label>
      </div>
      <div className="panel stack">
        <h2>Fit</h2>
        <label>Minimum match score — {minFit}%<input type="range" min="0" max="100" step="5" value={minFit} onChange={e=>{const next=+e.target.value;setMinFit(next);if(threshold<next)setThreshold(next)}}/></label>
        <p className="finePrint">RADR will only show jobs at or above this score.</p>
        <label>Strong-match threshold — {threshold}%<input type="range" min={minFit} max="100" step="5" value={threshold} onChange={e=>setThreshold(+e.target.value)}/></label>
        <p className="finePrint">Email/push alerts are not enabled yet. Strong matches will still appear in your Radar.</p>
        <div className="goalBox"><span>Daily application goal</span><strong>5</strong></div>
      </div>
    </section>
    <div className="actions"><button className="btn primary" disabled={saving} onClick={()=>void save()}>{saving?<span className="buttonSpinner" aria-label="Saving"/>:'Save preferences'}</button></div>
    {status&&<p className="status error" role="status">{status}</p>}
  </>
}
