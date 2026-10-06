import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps=[
  ['01','Set the direction','Choose the roles, location and working style you want. Your preferences guide the search without limiting it to exact phrases.'],
  ['02','Add your CV','We read the experience, tools, skills and role language already present in your CV and use them as additional search and matching signals.'],
  ['03','Work from a shortlist','Review a smaller set of sourced roles, understand the match, save the useful ones and prepare an application.'],
]

export default function LandingPage(){return <div className="landingPage editorialLanding">
  <a className="skipLink" href="#main">Skip to main content</a>
  <header className="landingNav"><Link to="/" className="wordmark">Job Radar</Link><nav aria-label="Primary"><a href="#method">Method</a><Link to="/privacy">Privacy</Link></nav><div className="landingActions"><Link className="textAction" to="/auth?mode=login&prompt=1">Sign in</Link><Link className="btn primary" to="/auth?mode=signup">Create account</Link></div></header>
  <main id="main"><section className="heroSection editorialHero"><div className="heroIndex">01 / CAREER SEARCH</div><h1>Less searching.<br/>Better reasons to apply.</h1><div className="heroLower"><p className="heroCopy">A focused job-search workspace that uses your CV, preferences and trusted job sources to narrow the market into roles worth your time.</p><Link className="heroLink" to="/auth?mode=signup">Start your search <ArrowRight size={17}/></Link></div></section>
  <section className="proofStrip" aria-label="Product principles"><span>CV-informed matching</span><span>Direct application sources</span><span>Private resume storage</span><span>No fabricated credentials</span></section>
  <section id="method" className="landingSection methodSection"><div className="sectionIntro"><p className="sectionNumber">02</p><h2>A search process,<br/>not another job board.</h2></div><div className="methodList">{steps.map(([n,title,body])=><article className="methodRow" key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
  <section className="closingSection"><p>Built for deliberate applications.</p><h2>Keep the search broad.<br/>Keep the shortlist useful.</h2><Link className="heroLink" to="/auth?mode=signup">Create your radar <ArrowRight size={17}/></Link></section></main>
  <footer className="publicFooter"><div><b>Job Radar</b><p>Independent career-search software project.</p></div><nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cookies">Cookies</Link><Link to="/accessibility">Accessibility</Link></nav></footer>
</div>}
