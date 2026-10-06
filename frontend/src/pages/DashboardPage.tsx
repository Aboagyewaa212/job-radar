import {Link} from 'react-router-dom'
import {useRadar} from '../hooks/useRadar'

export default function DashboardPage(){
  const{jobs,loading,appliedToday,dailyGoal}=useRadar()
  const saved=jobs.filter(j=>j.application_progress?.[0]?.saved).length
  const active=jobs.filter(j=>['applying','applied','interview','offer'].includes(j.application_progress?.[0]?.stage??'')).length
  const interviews=jobs.filter(j=>j.application_progress?.[0]?.stage==='interview').length
  const top=jobs.slice(0,3)
  return <div className="dashboardPage">
    <header className="pageHeader cleanHeader"><h1>Dashboard</h1></header>
    <section className="dashboardStats" aria-label="Job search overview">
      <Link to="/radar" className="statBlock"><strong>{loading?'—':jobs.length}</strong><span>on your RADR</span></Link>
      <Link to="/saved" className="statBlock"><strong>{saved}</strong><span>saved</span></Link>
      <Link to="/applications" className="statBlock"><strong>{active}</strong><span>active applications</span></Link>
      <Link to="/applications" className="statBlock"><strong>{interviews}</strong><span>interviews</span></Link>
    </section>
    <div className="dashboardGrid">
      <section className="dashboardPanel">
        <div className="panelHeading"><h2>Today</h2><span>{appliedToday}/{dailyGoal} applications</span></div>
        <div className="progressTrack" aria-label={`${appliedToday} of ${dailyGoal} daily applications completed`}><span style={{width:`${Math.min(100,(appliedToday/dailyGoal)*100)}%`}}/></div>
        <p>{Math.max(0,dailyGoal-appliedToday)} quality applications left before your daily cap.</p>
        <Link className="textLink" to="/radar">Open RADR →</Link>
      </section>
      <section className="dashboardPanel">
        <div className="panelHeading"><h2>Strong matches</h2><Link to="/radar">View all</Link></div>
        <div className="dashboardMatches">{top.map(job=><article key={job.id}><div><b>{job.title}</b><span>{job.company}</span></div><strong>{job.user_job_matches?.[0]?.fit_score??0}%</strong></article>)}{!top.length&&!loading&&<p>No matches yet.</p>}</div>
      </section>
    </div>
    <section className="nextActions">
      <h2>Next</h2>
      <Link to="/radar"><span>Review today's RADR</span><b>→</b></Link>
      <Link to="/resume"><span>Tailor a CV or cover letter</span><b>→</b></Link>
      <Link to="/applications"><span>Update application progress</span><b>→</b></Link>
    </section>
  </div>
}
