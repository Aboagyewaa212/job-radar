import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { ApplicationStage, RadarJob } from '../services/types'
import { useAuth } from './useAuth'

export function useRadar(){
  const {user}=useAuth(); const [jobs,setJobs]=useState<RadarJob[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null)
  const refresh=useCallback(async()=>{
    if(!user)return
    setLoading(true);setError(null)
    const {data,error}=await supabase.from('jobs').select(`id,title,company,location,fully_remote,employment_type,salary,description,requirements,skills,application_url,application_method,application_email,application_instructions,posted_at,last_verified_at,source_count,job_sources(name),user_job_matches!inner(fit_score,why_match,missing_skills),application_progress(saved,stage,applied_at,notes)`).order('posted_at',{ascending:false,nullsFirst:false}).limit(150)
    if(error)setError(error.message);else setJobs((data??[]) as unknown as RadarJob[])
    setLoading(false)
  },[user])
  useEffect(()=>{void refresh()},[refresh])
  const runMatching=async()=>{const {error}=await supabase.functions.invoke('match-user-jobs',{body:{}});if(error)throw error;await refresh()}
  const updateProgress=async(jobId:string, patch:{saved?:boolean;stage?:ApplicationStage;notes?:string|null})=>{
    if(!user)throw new Error('Not signed in')
    const payload={user_id:user.id,job_id:jobId,...patch,updated_at:new Date().toISOString(),...(patch.stage==='applied'?{applied_at:new Date().toISOString()}:{})}
    const {error}=await supabase.from('application_progress').upsert(payload,{onConflict:'user_id,job_id'});if(error)throw error;await refresh()
  }
  return {jobs,loading,error,refresh,runMatching,updateProgress}
}
