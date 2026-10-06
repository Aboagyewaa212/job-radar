import {JobCard} from '../components/JobCard'
import {useRadar} from '../hooks/useRadar'
export default function SavedPage(){const{jobs,loading,updateProgress}=useRadar();const saved=jobs.filter(j=>j.application_progress?.[0]?.saved);return <><header className="pageHeader cleanHeader"><h1>Saved</h1></header>{loading&&<div className="empty">Loading…</div>}{!loading&&!saved.length&&<div className="empty">No saved jobs yet.</div>}<section className="jobList">{saved.map(j=><JobCard key={j.id} job={j} onProgress={updateProgress}/>)}</section></>}
