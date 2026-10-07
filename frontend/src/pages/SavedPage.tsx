import {Bookmark} from 'lucide-react'
import {JobCard} from '../components/JobCard'
import {useRadar} from '../hooks/useRadar'

export default function SavedPage(){
  const{jobs,loading,updateProgress}=useRadar()
  const saved=jobs.filter(j=>j.application_progress?.[0]?.saved)
  return <>
    <header className="pageHeader cleanHeader">
      <div><span className="pageEyebrow">Shortlist</span><h1>Saved</h1></div>
      <span className="headerCount">{saved.length}</span>
    </header>
    {loading&&<div className="emptyState"><Bookmark size={20}/><b>Loading saved jobs…</b></div>}
    {!loading&&!saved.length&&<div className="emptyState"><Bookmark size={20}/><b>No saved jobs yet</b><span>Save roles from RADR to build your shortlist.</span></div>}
    <section className="jobList">{saved.map(j=><JobCard key={j.id} job={j} onProgress={updateProgress}/>)}</section>
  </>
}
