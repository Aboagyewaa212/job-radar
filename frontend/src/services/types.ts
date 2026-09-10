export type ApplicationStage = 'discovered'|'saved'|'applying'|'applied'|'interview'|'rejected'|'offer'|'withdrawn'

export type RadarJob = {
  id: string
  title: string
  company: string
  location: string | null
  fully_remote: boolean
  employment_type: string | null
  salary: string | null
  description: string | null
  requirements: string[]
  skills: string[]
  application_url: string
  canonical_url: string | null
  application_method: string | null
  application_email: string | null
  application_instructions: string[]
  posted_at: string | null
  last_verified_at: string
  source_count: number
  job_sources?: { name: string } | null
  user_job_matches?: Array<{ fit_score:number; why_match:string[]; missing_skills:string[] }>
  application_progress?: Array<{ saved:boolean; stage:ApplicationStage; applied_at:string|null; notes:string|null }>
}
