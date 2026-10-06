import {useMemo,useState} from 'react'
import {Bookmark,ExternalLink,MapPin,RefreshCw,Search} from 'lucide-react'
import type {ApplicationStage,RadarJob} from '../services/types'
import {useRadar} from '../hooks/useRadar'

const clean=(value:string|null|undefined)=>String(value??'').replace(/Â/g,'').replace(/\s+/g,' ').trim()
const deadline=(value:string|null)=>value?new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'No deadline listed'
const safeHttpUrl=(value:string|null|undefined)=>{try{const url=new URL(String(value??''));return url.protocol==='https:'||url.protocol==='http:'?url.toString():null}catch{return null}}

function RadarRow({job,onProgress}:{job:RadarJob;onProgress:(jobId:string,patch:{saved?:boolean;stage?:ApplicationStage})=>Promise<void>}){
  const[open,setOpen]=useState(false)
  const match=job.user_job_matches?.[0],progress=job.application_progress?.[0],fit=match?.fit_score??0
  const applicationUrl=safeHttpUrl(job.application_url),sourceUrl=safeHttpUrl(job.canonical_url)||applicationUrl
  return <>
    <article className="radarTableRow">
      <div className="radarJobCell">
        <button className="iconButton" aria-label={progress?.saved?'Remove saved job':'Save job'} onClick={()=>void onProgress(job.id,{saved:!progress?.saved,stage:!progress?.saved?'saved':progress?.stage==='saved'?'discovered':progress?.stage})}>
          <Bookmark size={17} fill={progress?.saved?'currentColor':'none'}/>
        </button>
        <div><strong>{clean(job.title)}</strong><span>{clean(job.company)}</span></div>
      </div>
      <div className="radarSourceCell">{sourceUrl?<a href={sourceUrl} target="_blank" rel="noopener noreferrer">{job.job_sources?.name??'Verified source'}</a>:<span>{job.job_sources?.name??'Verified source'}</span>}<small>checked {new Date(job.last_verified_at).toLocaleDateString()}</small></div>
      <div className="radarFitCell"><strong>{fit}%</strong><span>fit</span></div>
      <div className="radarLocationCell"><MapPin size={14}/><span>{clean(job.location)||'Remote'}</span></div>
      <div className="radarDeadlineCell">{deadline(job.expires_at)}</div>
      <div className="radarStatusCell">{progress?.stage&&progress.stage!=='discovered'?progress.stage:'New'}</div>
      <div className="radarActionCell">
        <button className="btn secondary" onClick={()=>setOpen(v=>!v)}>{open?'Hide details':'View details'}</button>
        {applicationUrl?<a className="iconButton" href={applicationUrl} target="_blank" rel="noopener noreferrer" aria-label="Open application"><ExternalLink size={17}/></a>:null}
      </div>
    </article>
    {open&&<section className="radarExpanded">
      <div><h3>Overview</h3><p>{clean(job.description)||'Open the original listing for the employer’s full role description.'}</p></div>
      <div><h3>Skills</h3><p>{job.skills?.length?job.skills.slice(0,8).map(clean).join(' · '):'No skills listed in the feed.'}</p></div>
      <div><h3>Why this surfaced</h3><p>{match?.why_match?.length?match.why_match.slice(0,4).map(clean).join(' · '):'Matched from your profile and preferences.'}</p></div>
      <div className="radarExpandedActions">
        {progress?.stage==='applied'?<span className="appliedPill">Applied ✓</span>:<button className="btn secondary" onClick={()=>void onProgress(job.id,{stage:'applied'})}>Mark applied</button>}
        {applicationUrl?<a className="btn primary" href={applicationUrl} target="_blank" rel="noopener noreferrer">Apply <ExternalLink size={14}/></a>:null}
      </div>
    </section>}
  </>
}

export default function RadarPage(){
  const{jobs,loading,error,appliedToday,dailyGoal,runMatching,updateProgress}=useRadar()
  const[q,setQ]=useState(''),[source,setSource]=useState('all'),[workType,setWorkType]=useState('all'),[score,setScore]=useState('all'),[busy,setBusy]=useState(false)

  const sources=useMemo(()=>Array.from(new Set(jobs.map(j=>j.job_sources?.name).filter(Boolean) as string[])).sort(),[jobs])
  const filtered=useMemo(()=>jobs.filter(j=>{
    const text=`${j.title} ${j.company} ${(j.skills||[]).join(' ')}`.toLowerCase()
    const qOk=text.includes(q.toLowerCase())
    const sourceOk=source==='all'||j.job_sources?.name===source
    const workOk=workType==='all'||(workType==='remote'?j.fully_remote:!j.fully_remote)
    const fit=j.user_job_matches?.[0]?.fit_score??0
    const scoreOk=score==='all'||(score==='80'?fit>=80:score==='60'?fit>=60&&fit<80:fit<60)
    return qOk&&sourceOk&&workOk&&scoreOk
  }),[jobs,q,source,workType,score])

  const saved=jobs.filter(j=>j.application_progress?.[0]?.saved).length
  const applied=jobs.filter(j=>j.application_progress?.[0]?.stage==='applied').length
  const interviews=jobs.filter(j=>j.application_progress?.[0]?.stage==='interview').length
  const offers=jobs.filter(j=>j.application_progress?.[0]?.stage==='offer').length

  async function rematch(){setBusy(true);try{await runMatching()}finally{setBusy(false)}}
  function resetFilters(){setQ('');setSource('all');setWorkType('all');setScore('all')}

  return <>
    <header className="pageHeader cleanHeader"><h1>RADR</h1><button className="btn secondary" onClick={()=>void rematch()} disabled={busy}><RefreshCw size={15}/>{busy?'Matching…':'Refresh'}</button></header>

    <section className="radarStats" aria-label="RADR overview">
      <div className="radarStat"><strong>{loading?'—':jobs.length}</strong><span>Total matches</span></div>
      <div className="radarStat"><strong>{loading?'—':jobs.filter(j=>(j.user_job_matches?.[0]?.fit_score??0)>=80).length}</strong><span>Strong matches</span></div>
      <div className="radarStat"><strong>{saved}</strong><span>Saved</span></div>
      <div className="radarStat"><strong>{applied}</strong><span>Applied</span></div>
      <div className="radarStat"><strong>{interviews}</strong><span>Interviews</span></div>
      <div className="radarStat"><strong>{offers}</strong><span>Offers</span></div>
    </section>

    <section className="goalBanner"><div><b>{Math.max(0,dailyGoal-appliedToday)} applications left today</b><span>{appliedToday} of {dailyGoal} completed</span></div><strong>{appliedToday}/{dailyGoal}</strong></section>

    <section className="radarFilterRow">
      <label className="radarSearch"><Search size={17}/><input aria-label="Search jobs" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search roles, companies, skills…"/></label>
      <select aria-label="Filter by source" value={source} onChange={e=>setSource(e.target.value)}><option value="all">All sources</option>{sources.map(item=><option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Filter by work type" value={workType} onChange={e=>setWorkType(e.target.value)}><option value="all">All work types</option><option value="remote">Remote</option><option value="onsite">Not fully remote</option></select>
      <select aria-label="Filter by match score" value={score} onChange={e=>setScore(e.target.value)}><option value="all">All match scores</option><option value="80">80% and above</option><option value="60">60–79%</option><option value="low">Below 60%</option></select>
      <button className="btn secondary radarReset" type="button" onClick={resetFilters}>Reset</button>
    </section>

    {loading&&<div className="empty">Loading your RADR…</div>}
    {error&&<div className="empty error">{error}</div>}
    {!loading&&!error&&!filtered.length&&<div className="empty">No matching roles yet. Refresh after updating your profile or when new jobs are added.</div>}

    {!loading&&!error&&filtered.length>0&&<section className="radarTable" aria-label="Matched jobs">
      <div className="radarTableHead">
        <span>Job</span><span>Source</span><span>Match</span><span>Location</span><span>Deadline</span><span>Status</span><span>Actions</span>
      </div>
      <div className="radarTableBody">{filtered.map(job=><RadarRow key={job.id} job={job} onProgress={updateProgress}/>)}</div>
    </section>}
  </>
}
