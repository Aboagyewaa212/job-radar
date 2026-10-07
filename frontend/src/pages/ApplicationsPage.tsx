import {useState} from 'react'
import {useRadar} from '../hooks/useRadar'
import type {ApplicationStage} from '../services/types'

const stages=['saved','applying','applied','interview','offer','rejected','withdrawn'] as const
type VisibleStage=typeof stages[number]

export default function ApplicationsPage(){
  const{jobs,updateProgress}=useRadar()
  const[status,setStatus]=useState('')

  async function move(jobId:string,stage:VisibleStage){
    setStatus('')
    try{
      const patch: {stage:ApplicationStage;saved?:boolean}=stage==='saved'?{stage,saved:true}:{stage}
      await updateProgress(jobId,patch)
    }catch(error){
      setStatus(error instanceof Error?error.message:'Could not update application stage')
    }
  }

  return <><header className="pageHeader cleanHeader"><h1>Applications</h1></header>
    {status&&<p className="status" role="status">{status}</p>}
    <div className="kanban">{stages.map(stage=><section className="kanbanCol" key={stage}>
      <div className="kanbanTitle"><h2>{stage[0].toUpperCase()+stage.slice(1)}</h2><span>{jobs.filter(j=>j.application_progress?.[0]?.stage===stage).length}</span></div>
      {jobs.filter(j=>j.application_progress?.[0]?.stage===stage).map(j=><article className="miniCard" key={j.id}>
        <b>{j.title}</b>
        <span>{j.company}</span>
        <small>{j.user_job_matches?.[0]?.fit_score??0}% fit</small>
        <label className="stageControl">Stage
          <select aria-label={`Update ${j.title} application stage`} value={stage} onChange={e=>void move(j.id,e.target.value as VisibleStage)}>
            {stages.map(option=><option key={option} value={option}>{option[0].toUpperCase()+option.slice(1)}</option>)}
          </select>
        </label>
      </article>)}
    </section>)}</div>
  </>
}
