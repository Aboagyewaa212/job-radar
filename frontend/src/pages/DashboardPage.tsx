import {ArrowRight,BriefcaseBusiness,CheckCircle2,Sparkles,Target} from 'lucide-react'
import {Link} from 'react-router-dom'
import {useRadar} from '../hooks/useRadar'

export default function DashboardPage(){
  const{jobs,loading,appliedToday,dailyGoal}=useRadar()
  const saved=jobs.filter(j=>j.application_progress?.[0]?.saved).length
  const active=jobs.filter(j=>['applying','applied','interview','offer'].includes(j.application_progress?.[0]?.stage??'')).length
  const interviews=jobs.filter(j=>j.application_progress?.[0]?.stage==='interview').length
  const top=jobs.slice(0,4)
  const remaining=Math.max(0,dailyGoal-appliedToday)
  const progress=dailyGoal>0?Math.min(100,(appliedToday/dailyGoal)*100):0

  return <div className="dashboardPage">
    <header className="pageHeader cleanHeader">
      <div><span className="pageEyebrow">Overview</span><h1>Dashboard</h1></div>
      <Link className="btn primary" to="/radar">Review RADR <ArrowRight size={15}/></Link>
    </header>

    <section className="dashboardStats" aria-label="Job search overview">
      <Link to="/radar" className="statBlock"><span>Matches</span><strong>{loading?'—':jobs.length}</strong><small>On your RADR</small></Link>
      <Link to="/saved" className="statBlock"><span>Saved</span><strong>{saved}</strong><small>Worth revisiting</small></Link>
      <Link to="/applications" className="statBlock"><span>Active</span><strong>{active}</strong><small>Applications in motion</small></Link>
      <Link to="/applications" className="statBlock"><span>Interviews</span><strong>{interviews}</strong><small>Current conversations</small></Link>
    </section>

    <div className="dashboardGrid">
      <section className="dashboardPanel dailyGoalPanel">
        <div className="panelHeading">
          <div className="panelTitle"><Target size={18}/><div><span className="sectionEyebrow">Daily pace</span><h2>Application goal</h2></div></div>
          <strong className="goalNumber">{appliedToday}/{dailyGoal}</strong>
        </div>
        <div className="progressTrack" aria-label={`${appliedToday} of ${dailyGoal} daily applications completed`}><span style={{width:`${progress}%`}}/></div>
        <div className="goalFooter">
          <span>{remaining===0?'Goal complete for today':`${remaining} ${remaining===1?'application':'applications'} left`}</span>
          <Link className="inlineArrow" to="/radar">Find roles <ArrowRight size={14}/></Link>
        </div>
      </section>

      <section className="dashboardPanel">
        <div className="panelHeading">
          <div className="panelTitle"><Sparkles size={18}/><div><span className="sectionEyebrow">Best available</span><h2>Strong matches</h2></div></div>
          <Link className="inlineArrow" to="/radar">View all <ArrowRight size={14}/></Link>
        </div>
        <div className="dashboardMatches">
          {top.map(job=><article key={job.id}>
            <div className="matchIdentity"><b>{job.title}</b><span>{job.company}</span></div>
            <strong>{job.user_job_matches?.[0]?.fit_score??0}%</strong>
          </article>)}
          {!top.length&&!loading&&<div className="compactEmpty">No matches yet.</div>}
        </div>
      </section>
    </div>

    <section className="nextActions">
      <div className="panelHeading"><div><span className="sectionEyebrow">Continue</span><h2>Next actions</h2></div></div>
      <div className="nextActionGrid">
        <Link to="/radar"><div className="actionIcon"><Target size={18}/></div><div><b>Review RADR</b><span>See your latest matched roles.</span></div><ArrowRight size={16}/></Link>
        <Link to="/resume"><div className="actionIcon"><CheckCircle2 size={18}/></div><div><b>Prepare an application</b><span>Tailor your CV or draft a letter.</span></div><ArrowRight size={16}/></Link>
        <Link to="/applications"><div className="actionIcon"><BriefcaseBusiness size={18}/></div><div><b>Update progress</b><span>Keep your pipeline current.</span></div><ArrowRight size={16}/></Link>
      </div>
    </section>
  </div>
}
