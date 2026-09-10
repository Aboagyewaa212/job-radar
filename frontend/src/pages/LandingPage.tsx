import { ArrowRight, CheckCircle2, FileText, Radar, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const features:Array<[string,string,LucideIcon]>=[
  ['Verified job radar','Fresh roles from supported public feeds and official application destinations, ranked to your profile.',Radar],
  ['Resume Studio','Tailor a truthful CV for a specific role, update your source resume, and save job-specific versions.',FileText],
  ['Career assistant','Generate job-specific cover letters and application guidance without inventing experience.',Sparkles],
  ['Privacy by design','Private resumes, per-user row-level security, minimal data collection, and no ad trackers.',ShieldCheck],
]

export default function LandingPage(){return <div className="landingPage">
  <a className="skipLink" href="#main">Skip to main content</a>
  <header className="landingNav"><Link to="/" className="brand publicBrand"><span className="brandMark">J</span><div><b>Job Radar</b><small>CAREER INTELLIGENCE</small></div></Link><nav aria-label="Primary"><a href="#how">How it works</a><Link to="/accessibility">Accessibility</Link></nav><div className="landingActions"><Link className="btn secondary" to="/auth?mode=login">Sign in</Link><Link className="btn primary" to="/auth?mode=signup">Create account <ArrowRight size={15}/></Link></div></header>
  <main id="main"><section className="heroSection"><p className="eyebrow">A QUIETER WAY TO SEARCH</p><h1>Find work that fits your evidence, not just your keywords.</h1><p className="heroCopy">Job Radar combines verified job feeds, your CV, and your career direction to surface stronger matches and help you prepare better applications.</p><div className="heroActions"><Link className="btn primary" to="/auth?mode=signup">Build my radar <ArrowRight size={15}/></Link><a className="btn secondary" href="#how">See how it works</a></div><div className="trustRow" aria-label="Product principles"><span><CheckCircle2 size={15}/>No fabricated credentials</span><span><CheckCircle2 size={15}/>Direct source links</span><span><CheckCircle2 size={15}/>Private CV storage</span></div></section>
  <section id="how" className="landingSection"><p className="eyebrow">HOW IT WORKS</p><div className="featureGrid">{features.map(([title,body,Icon])=><article className="featureCard" key={title}><Icon size={21}/><h2>{title}</h2><p>{body}</p></article>)}</div></section>
  </main>
  <footer className="publicFooter"><div><b>Job Radar</b><p>Independent career-search software project. No incorporated business entity is claimed on this site.</p></div><nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cookies">Cookies</Link><Link to="/accessibility">Accessibility</Link><Link to="/refunds">Refunds</Link></nav></footer>
</div>}
