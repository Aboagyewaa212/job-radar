import {useEffect,useMemo,useState} from 'react'
import {BriefcaseBusiness,Globe2,Link as LinkIcon,Mail,MapPin,Phone,Save,Trash2,UserRound} from 'lucide-react'
import {supabase} from '../services/supabase'
import {useAuth} from '../hooks/useAuth'

const list=(value:string)=>value.split(',').map(item=>item.trim()).filter(Boolean)

export default function ProfilePage(){
  const{user,signOut}=useAuth()
  const[displayName,setDisplayName]=useState('')
  const[headline,setHeadline]=useState('')
  const[summary,setSummary]=useState('')
  const[location,setLocation]=useState('')
  const[phone,setPhone]=useState('')
  const[linkedin,setLinkedin]=useState('')
  const[portfolio,setPortfolio]=useState('')
  const[level,setLevel]=useState('')
  const[years,setYears]=useState('')
  const[fields,setFields]=useState('')
  const[skills,setSkills]=useState('')
  const[saving,setSaving]=useState(false)
  const[error,setError]=useState('')
  const[deleting,setDeleting]=useState(false)

  useEffect(()=>{
    if(!user)return
    supabase.from('profiles').select('*').eq('user_id',user.id).single().then(({data,error})=>{
      if(error){setError(error.message);return}
      if(!data)return
      setDisplayName(data.display_name||'')
      setHeadline(data.headline||'')
      setSummary(data.professional_summary||'')
      setLocation(data.location||'')
      setPhone(data.phone||'')
      setLinkedin(data.linkedin_url||'')
      setPortfolio(data.portfolio_url||'')
      setLevel(data.experience_level||'')
      setYears(data.years_experience==null?'':String(data.years_experience))
      setFields((data.target_fields||[]).join(', '))
      setSkills((data.skills||[]).join(', '))
    })
  },[user])

  const completion=useMemo(()=>{
    const values=[displayName,headline,summary,location,level,fields,skills]
    return Math.round((values.filter(value=>value.trim()).length/values.length)*100)
  },[displayName,headline,summary,location,level,fields,skills])

  const initials=useMemo(()=>{
    const source=displayName.trim()||user?.email?.split('@')[0]||'R'
    return source.split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')
  },[displayName,user?.email])

  async function save(){
    if(!user||saving)return
    setSaving(true);setError('')
    const parsedYears=years.trim()===''?null:Number(years)
    if(parsedYears!==null&&(!Number.isFinite(parsedYears)||parsedYears<0||parsedYears>60)){
      setError('Years of experience must be between 0 and 60.')
      setSaving(false)
      return
    }
    try{
      const targetFields=list(fields)
      const{error}=await supabase.from('profiles').update({
        display_name:displayName.trim()||null,
        headline:headline.trim()||null,
        professional_summary:summary.trim()||null,
        location:location.trim()||null,
        phone:phone.trim()||null,
        linkedin_url:linkedin.trim()||null,
        portfolio_url:portfolio.trim()||null,
        experience_level:level.trim()||null,
        years_experience:parsedYears,
        target_fields:targetFields,
        skills:list(skills),
        updated_at:new Date().toISOString(),
      }).eq('user_id',user.id)
      if(error)throw error

      const{error:preferencesError}=await supabase.from('preferences').update({
        target_roles:targetFields,
        updated_at:new Date().toISOString(),
      }).eq('user_id',user.id)
      if(preferencesError)throw preferencesError

      const{error:matchError}=await supabase.functions.invoke('match-user-jobs',{body:{}})
      if(matchError)console.warn('Profile saved; RADR matching refresh deferred:',matchError.message)
    }catch(error){
      setError(error instanceof Error?error.message:'Could not save profile')
    }finally{
      setSaving(false)
    }
  }

  async function deleteAccount(){
    const confirmation=window.prompt('Type DELETE to permanently delete your account and data.')
    if(confirmation!=='DELETE')return
    setDeleting(true);setError('')
    const{error}=await supabase.functions.invoke('delete-account',{body:{confirmation:'DELETE'}})
    if(error){setError(error.message);setDeleting(false);return}
    await signOut()
    window.location.assign('/')
  }

  return <>
    <header className="pageHeader cleanHeader"><h1>Profile</h1></header>

    <div className="profileLayout">
      <aside className="profileSummaryCard">
        <div className="profileAvatar">{initials}</div>
        <div className="profileSummaryText">
          <h2>{displayName||'Your profile'}</h2>
          {headline&&<p>{headline}</p>}
          {location&&<span><MapPin size={14}/>{location}</span>}
        </div>
        <div className="profileCompletion">
          <div><span>Profile completion</span><strong>{completion}%</strong></div>
          <div className="profileProgress"><span style={{width:`${completion}%`}}/></div>
        </div>
      </aside>

      <div className="profileContent">
        <section className="profileSection">
          <div className="profileSectionHeading"><UserRound size={18}/><div><h2>Personal details</h2></div></div>
          <div className="profileFieldGrid">
            <label>Full name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name"/></label>
            <label>Email<div className="profileReadOnly"><Mail size={15}/><span>{user?.email||'—'}</span></div></label>
            <label>Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Accra, Ghana" autoComplete="address-level2"/></label>
            <label>Phone<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+233…" autoComplete="tel"/></label>
          </div>
        </section>

        <section className="profileSection">
          <div className="profileSectionHeading"><BriefcaseBusiness size={18}/><div><h2>Professional profile</h2></div></div>
          <div className="profileFieldGrid">
            <label className="profileWide">Headline<input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Executive support, operations and coordination"/></label>
            <label className="profileWide">Professional summary<textarea rows={5} maxLength={1200} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="A short summary of your background, strengths and the kind of work you do."/></label>
            <label>Experience level<select value={level} onChange={e=>setLevel(e.target.value)}>
              <option value="">Select level</option>
              <option value="Student / Graduate">Student / Graduate</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Lead / Manager">Lead / Manager</option>
            </select></label>
            <label>Years of experience<input type="number" min="0" max="60" step="0.5" value={years} onChange={e=>setYears(e.target.value)} placeholder="0"/></label>
          </div>
        </section>

        <section className="profileSection">
          <div className="profileSectionHeading"><Globe2 size={18}/><div><h2>Career direction</h2></div></div>
          <div className="profileFieldGrid">
            <label className="profileWide">Target roles or fields<textarea rows={3} value={fields} onChange={e=>setFields(e.target.value)} placeholder="Executive Assistant, Recruiting Coordinator, Learning & Development Coordinator"/></label>
            <label className="profileWide">Skills<textarea rows={4} value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Calendar management, Google Workspace, project coordination, stakeholder communication"/></label>
          </div>
        </section>

        <section className="profileSection">
          <div className="profileSectionHeading"><LinkIcon size={18}/><div><h2>Links</h2></div></div>
          <div className="profileFieldGrid">
            <label>LinkedIn<input type="url" value={linkedin} onChange={e=>setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…"/></label>
            <label>Portfolio or website<input type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="https://…"/></label>
          </div>
        </section>

        <div className="profileSaveBar">
          <button className="btn primary" type="button" disabled={saving} onClick={()=>void save()}>{saving?<span className="buttonSpinner" aria-label="Saving"/>:<><Save size={15}/>Save profile</>}</button>
        </div>

        {error&&<div className="studioError" role="alert">{error}</div>}

        <section className="profileDanger">
          <div><Trash2 size={18}/><div><h2>Delete account</h2><p>This permanently removes your account and RADR data.</p></div></div>
          <button className="btn danger" type="button" disabled={deleting} onClick={()=>void deleteAccount()}>{deleting?'Deleting…':'Delete account'}</button>
        </section>
      </div>
    </div>
  </>
}
