import { render, screen } from '@testing-library/react'
import { JobCard } from '../components/JobCard'
import type { RadarJob } from '../services/types'

const baseJob:RadarJob={
  id:'job-1',title:'Frontend Engineer',company:'Example Co',location:'Remote worldwide',fully_remote:true,employment_type:'Full time',salary:null,description:'Build accessible React interfaces. You should know TypeScript.',requirements:[],skills:['React','TypeScript'],application_url:'https://example.com/apply',canonical_url:'https://example.com/job',application_method:'link',application_email:null,application_instructions:['Apply on the employer site.'],posted_at:'2026-09-01T00:00:00Z',expires_at:null,last_verified_at:'2026-09-10T00:00:00Z',source_count:1,job_sources:{name:'Example'},user_job_matches:[{fit_score:91,why_match:['React'],missing_skills:[]}],application_progress:[]
}

describe('JobCard',()=>{
  it('shows concise metadata and a safe application link',()=>{
    render(<JobCard job={baseJob} onProgress={async()=>{}}/>)
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Remote worldwide')).toBeInTheDocument()
    expect(screen.getByRole('link',{name:/apply/i})).toHaveAttribute('href','https://example.com/apply')
    expect(screen.queryByText(/fully remote/i)).not.toBeInTheDocument()
  })

  it('does not render an executable unsafe application URL',()=>{
    render(<JobCard job={{...baseJob,application_url:'javascript:alert(1)',canonical_url:null}} onProgress={async()=>{}}/>)
    expect(screen.queryByRole('link',{name:/apply/i})).not.toBeInTheDocument()
    expect(screen.getByText('Application link unavailable')).toBeInTheDocument()
  })
})
