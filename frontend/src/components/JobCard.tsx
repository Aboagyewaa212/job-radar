import { useMemo, useState } from 'react'
import { Bookmark, ExternalLink, Mail, MapPin } from 'lucide-react'
import type { ApplicationStage, RadarJob } from '../services/types'

const clean=(value:string|null|undefined)=>String(value??'').replace(/Â/g,'').replace(/\s+/g,' ').trim()
const sentences=(value:string)=>clean(value).split(/(?<=[.!?])\s+/).map(v=>v.trim()).filter(Boolean)
const safeHttpUrl=(value:string|null|undefined)=>{try{const url=new URL(String(value??''));return url.protocol==='https:'||url.protocol==='http:'?url.toString():null}catch{return null}}
const overview=(value:string|null)=>{const picked=sentences(value??'').slice(0,2).join(' ');if(!picked)return 'Open the original listing for the employer’s full role description.';return picked.length>420?`${picked.slice(0,417).trim()}…`:picked}
const inferredRequirements=(job:RadarJob)=>{if(job.requirements?.length)return job.requirements.slice(0,6);const markers=/\b(require|requirements?|must|should|experience|years?|skills?|proficient|knowledge|ability|degree|qualification|familiar|background)\b/i;return sentences(job.description??'').filter(v=>markers.test(v)).slice(0,5)}
const deadlineLabel=(value:string|null)=>value?new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'No deadline listed'

export function JobCard({job,onProgress}:{job:RadarJob;onProgress:(jobId:string,patch:{saved?:boolean;stage?:ApplicationStage})=>Promise<void>}){
  const[open,setOpen]=useState(false),match=job.user_job_matches?.[0],progress=job.application_progress?.[0],fit=match?.fit_score??0
  const applicationUrl=safeHttpUrl(job.application_url),sourceUrl=safeHttpUrl(job.canonical_url)||applicationUrl,requirements=useMemo(()=>inferredRequirements(job),[job])
  return <article className="jobCard">
    <div className="jobTop"><span className="source">{sourceUrl?<a href={sourceUrl} target="_blank" rel="noopener noreferrer">{job.job_sources?.name??'Verified source'}</a>:<span>{job.job_sources?.name??'Verified source'}</span>} · checked {new Date(job.last_verified_at).toLocaleDateString()}</span><button className="iconButton" aria-label={progress?.saved?'Remove saved job':'Save job'} onClick={()=>void onProgress(job.id,{saved:!progress?.saved,stage:!progress?.saved?'saved':progress?.stage==='saved'?'discovered':progress?.stage})}><Bookmark size={17} fill={progress?.saved?'currentColor':'none'}/></button></div>
    <div className="jobHeading"><div className="jobIdentity"><h2>{clean(job.title)}</h2><div className="jobSubline"><span>{clean(job.company)}</span><span>Deadline: {deadlineLabel(job.expires_at)}</span>{job.salary&&<span>{clean(job.salary)}</span>}</div></div><div className="fit"><strong>{fit}%</strong><span>fit</span></div></div>
    <div className="meta"><span><MapPin size={14}/>{clean(job.location)||'Remote'}</span>{job.employment_type&&<span>{clean(job.employment_type)}</span>}</div>
    <div className="tags">{(job.skills||[]).slice(0,5).map(s=><span key={s}>{clean(s)}</span>)}</div>
    {open&&<div className="jobDetailsClean"><section><h3>Overview</h3><p>{overview(job.description)}</p></section><section><h3>Requirements</h3>{requirements.length?<ul>{requirements.map((item,index)=><li key={`${index}-${item}`}>{clean(item)}</li>)}</ul>:<p>No concise requirements were provided in the feed. Check the original listing before applying.</p>}</section><section><h3>How to apply</h3>{job.application_email&&<p><b>Email:</b> {job.application_email}</p>}{job.application_instructions?.length?<ul>{job.application_instructions.slice(0,5).map((item,index)=><li key={`${index}-${item}`}>{clean(item)}</li>)}</ul>:<p>Use the employer’s application link below and follow the instructions on the original listing.</p>}{match?.why_match?.length?<p className="matchNote"><b>Why this surfaced:</b> {match.why_match.slice(0,4).map(clean).join(' · ')}</p>:null}</section></div>}
    <div className="actions"><button className="btn secondary" onClick={()=>setOpen(v=>!v)}>{open?'Hide details':'View details'}</button>{progress?.stage==='applied'?<span className="appliedPill">Applied ✓</span>:<button className="btn secondary" onClick={()=>void onProgress(job.id,{stage:'applied'})}>Mark applied</button>}{applicationUrl?<a className="btn primary" href={applicationUrl} target="_blank" rel="noopener noreferrer">Apply <ExternalLink size={14}/></a>:<span className="btn secondary" aria-disabled="true">Application link unavailable</span>}</div>
  </article>
}
