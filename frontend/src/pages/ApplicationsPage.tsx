import {useState} from 'react'
import {BriefcaseBusiness} from 'lucide-react'
import {useRadar} from '../hooks/useRadar'
import type {ApplicationStage} from '../services/types'

const stages=['saved','applying','applied','interview','offer','rejected','withdrawn'] as const
type VisibleStage=typeof stages[number]
const stageLabel=(stage:VisibleStage)=>stage[0].toUpperCase()+stage.slice(1)

export default function ApplicationsPage(){
  const{jobs,updateProgress}=useRadar()
  const[status,setStatus]=useState('')

  async function move(jobId:string,stage:VisibleStage){
    setStatus('')
    try{
      const patch:{stage:ApplicationStage;saved?:boolean}=stage==='saved'?{stage,saved:true}:{stage}
      await updateProgress(jobId,patch)
    }catch(error){
      setStatus(error instanceof Error?error.message:'Could not update application stage')
    }
  }

  const tracked=jobs.filter(job=>stages.includes((job.application_progress?.[0]?.stage??'saved') as VisibleStage))

  return <>
    <header className="pageHeader cleanHeader">
      <div><span className="pageEyebrow">Pipeline</span><h1>Applications</h1></div>
      <span className="headerCount">{tracked.length}</span>
    </header>

    {status&&<div className="settingsMessage error" role="status">{status}</div>}

    {!tracked.length&&<div className="emptyState"><BriefcaseBusiness size={21}/><b>No applications yet</b><span>Save a role or mark it as applied from RADR to start tracking it here.</span></div>}

    <div className="kanban">{stages.map(stage=>{
      const stageJobs=jobs.filter(j=>j.application_progress?.[0]?.stage===stage)
      return <section className="kanbanCol" key={stage}>
        <div className="kanbanTitle"><div><span className="stageDot"/><h2>{stageLabel(stage)}</h2></div><span>{stageJobs.length}</span></div>
        <div className="kanbanStack">
          {stageJobs.map(j=><article className="miniCard" key={j.id}>
            <div className="miniCardTop"><div><b>{j.title}</b><span>{j.company}</span></div><strong>{j.user_job_matches?.[0]?.fit_score??0}%</strong></div>
            <label className="stageControl">
              <span className="visuallyHidden">Stage</span>
              <select aria-label={`Update ${j.title} application stage`} value={stage} onChange={e=>void move(j.id,e.target.value as VisibleStage)}>
                {stages.map(option=><option key={option} value={option}>{stageLabel(option)}</option>)}
              </select>
            </label>
          </article>)}
        </div>
      </section>
    })}</div>
  </>
}
