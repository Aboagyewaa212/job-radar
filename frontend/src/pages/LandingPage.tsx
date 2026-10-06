import {useState} from 'react'
import {Link} from 'react-router-dom'
import {RadrLogo} from '../components/RadrLogo'

const preview=[
  {title:'Project Coordinator',company:'Northstar',fit:94,reason:'Project coordination · Notion · stakeholder communication'},
  {title:'Community Manager',company:'Common Ground',fit:91,reason:'Community management · content · events'},
  {title:'Operations Associate',company:'Studio North',fit:89,reason:'Google Workspace · documentation · coordination'},
]

export default function LandingPage(){
  const[selected,setSelected]=useState(0)
  const job=preview[selected]
  return <div className="landingPage">
    <a className="skipLink" href="#main">Skip to main content</a>
    <header className="landingNav">
      <Link to="/" aria-label="RADR home"><RadrLogo/></Link>
      <div className="landingActions"><Link className="textAction" to="/auth?mode=login&prompt=1">Sign in</Link><Link className="btn primary" to="/auth?mode=signup">Create account</Link></div>
    </header>
    <main id="main">
      <section className="radrHero">
        <div className="heroCopyBlock"><h1>Find the work worth your attention.</h1><p>RADR reads the signals already in your CV, combines them with what you want next, and turns a noisy job market into a shortlist you can act on.</p><Link className="btn primary heroCta" to="/auth?mode=signup">Start your RADR</Link></div>
        <div className="radarDemo" aria-label="Interactive RADR preview">
          <div className="radarDemoTop"><RadrLogo compact/><span>Today</span></div>
          <div className="demoList">{preview.map((item,index)=><button type="button" className={index===selected?'selected':''} key={item.title} onClick={()=>setSelected(index)}><span><b>{item.title}</b><small>{item.company}</small></span><strong>{item.fit}%</strong></button>)}</div>
          <div className="demoReason"><b>Why it surfaced</b><p>{job.reason}</p></div>
        </div>
      </section>
      <section className="productFlow">
        <article><span>1</span><h2>Add your CV</h2><p>Your experience becomes part of the search rather than a file you only use at the end.</p></article>
        <article><span>2</span><h2>Set your direction</h2><p>Tell RADR what kind of work, location and setup you want more of.</p></article>
        <article><span>3</span><h2>Work the shortlist</h2><p>Save roles, track applications, tailor your CV and draft a cover letter for each job.</p></article>
      </section>
      <section className="landingClose"><RadrLogo inverse/><h2>Less scrolling. More deliberate applications.</h2><Link className="btn light" to="/auth?mode=signup">Create account</Link></section>
    </main>
    <footer className="publicFooter"><span>RADR</span><nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link></nav></footer>
  </div>
}
