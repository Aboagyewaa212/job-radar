import { ArrowRight, Check, FileText, Radar, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const features:Array<[string,string,LucideIcon]>=[
  ['Find the right openings','Fresh roles from supported public feeds and official application destinations, ranked against your profile.',Radar],
  ['Work from one source CV','Keep a private source resume and create truthful, job-specific versions without rewriting from scratch.',FileText],
  ['Keep the search organised','Save roles, track applications, and move from discovery to application without another spreadsheet.',ShieldCheck],
]

export default function LandingPage(){return <div className="landingPage">
  <a className="skipLink" href="#main">Skip to main content</a>
  <header className="landingNav"><Link to="/" className="brand publicBrand"><span className="brandMark">J</span><div><b>Job Radar</b><small>JOB SEARCH, ORGANISED</small></div></Link><nav aria-label="Primary"><a href="#product">Product</a><a href="#how">How it works</a></nav><div className="landingActions"><Link className="plainLink" to="/auth?mode=login">Sign in</Link><Link className="btn primary" to="/auth?mode=signup">Get started</Link></div></header>
  <main id="main">
    <section className="heroSection"><p className="eyebrow">A BETTER WORKING LIST</p><h1>Less job hunting.<br/>More good applications.</h1><div className="heroLower"><p className="heroCopy">Bring your CV and career direction. Job Radar finds relevant openings, keeps the search organised, and helps you prepare each application.</p><div className="heroActions"><Link className="btn primary" to="/auth?mode=signup">Start your search <ArrowRight size={15}/></Link><a className="plainLink" href="#how">How it works</a></div></div></section>
    <section id="product" className="productStrip"><p>Built for the actual search</p><div><span><Check size={14}/>Current roles</span><span><Check size={14}/>Direct application links</span><span><Check size={14}/>Private CV storage</span><span><Check size={14}/>Application tracking</span></div></section>
    <section id="how" className="landingSection"><div className="sectionIntro"><p className="eyebrow">THE WORKFLOW</p><h2>One place between finding a role and applying for it.</h2></div><div className="featureGrid">{features.map(([title,body,Icon],i)=><article className="featureCard" key={title}><div className="featureIndex">0{i+1}</div><Icon size={18}/><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="landingClosing"><p className="eyebrow">START WITH YOUR CV</p><h2>Your next application should begin with evidence, not another blank document.</h2><Link className="btn primary" to="/auth?mode=signup">Create an account <ArrowRight size={15}/></Link></section>
  </main>
  <footer className="publicFooter"><div><b>Job Radar</b><p>Independent career-search software project.</p></div><nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cookies">Cookies</Link><Link to="/accessibility">Accessibility</Link></nav></footer>
</div>}