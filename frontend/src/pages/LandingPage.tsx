import {Link} from 'react-router-dom'
import {RadrLogo} from '../components/RadrLogo'

const HERO_IMAGE='https://images.unsplash.com/photo-1758874384552-5d090a98033b?auto=format&fit=crop&fm=jpg&q=82&w=1800'

export default function LandingPage(){
  return <div className="landingPage">
    <a className="skipLink" href="#main">Skip to main content</a>
    <header className="landingNav">
      <Link to="/" aria-label="RADR home"><RadrLogo/></Link>
      <div className="landingActions"><Link className="textAction" to="/auth?mode=login&prompt=1">Sign in</Link><Link className="btn primary" to="/auth?mode=signup">Create account</Link></div>
    </header>
    <main id="main">
      <section className="radrHero">
        <div className="heroCopyBlock"><h1>Find the work worth your attention.</h1><p>RADR reads the signals already in your CV, combines them with what you want next, and turns a noisy job market into a shortlist you can act on.</p><Link className="btn primary heroCta" to="/auth?mode=signup">Start your RADR</Link></div>
        <figure className="heroPhoto"><img src={HERO_IMAGE} alt="Black woman wearing headphones while working on a laptop at a desk"/><figcaption>Remote work, without the endless search.</figcaption></figure>
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
