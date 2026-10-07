import {useMemo,useState} from 'react'
import {RefreshCw,Search,Target} from 'lucide-react'
import {JobCard} from '../components/JobCard'
import {useRadar} from '../hooks/useRadar'

export default function RadarPage(){
  const{jobs,loading,error,appliedToday,dailyGoal,runMatching,updateProgress}=useRadar()
  const[q,setQ]=useState('')
  const[busy,setBusy]=useState(false)
  const filtered=useMemo(()=>jobs.filter(j=>`${j.title} ${j.company} ${(j.skills||[]).join(' ')}`.toLowerCase().includes(q.toLowerCase())),[jobs,q])

  async function rematch(){setBusy(true);try{await runMatching()}finally{setBusy(false)}}

  return <>
    <header className="pageHeader cleanHeader">
      <div><span className="pageEyebrow">Discover</span><h1>RADR</h1></div>
      <button className="btn secondary" onClick={()=>void rematch()} disabled={busy}><RefreshCw className={busy?'spin':''} size={15}/>{busy?'Refreshing…':'Refresh matches'}</button>
    </header>

    <section className="goalBanner">
      <div className="goalIcon"><Target size={17}/></div>
      <div><b>{Math.max(0,dailyGoal-appliedToday)} applications left today</b><span>{appliedToday} of {dailyGoal} completed</span></div>
      <strong>{appliedToday}/{dailyGoal}</strong>
    </section>

    <div className="radarToolbar">
      <div className="toolbar">
        <Search size={16}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search roles, companies or skills…" aria-label="Search matched jobs"/>
      </div>
      <span className="resultCount">{loading?'Loading…':`${filtered.length} ${filtered.length===1?'role':'roles'}`}</span>
    </div>

    {loading&&<div className="emptyState"><RefreshCw className="spin" size={20}/><b>Loading your RADR…</b></div>}
    {error&&<div className="emptyState error">{error}</div>}
    {!loading&&!error&&!filtered.length&&<div className="emptyState"><Search size={20}/><b>No matching roles</b><span>Update your preferences or refresh when new jobs are available.</span></div>}
    <section className="jobList">{filtered.map(j=><JobCard key={j.id} job={j} onProgress={updateProgress}/>)}</section>
  </>
}
