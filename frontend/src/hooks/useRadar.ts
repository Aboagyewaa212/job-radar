import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabase'
import type { ApplicationStage, RadarJob } from '../services/types'
import { useAuth } from './useAuth'

export function useRadar(){
  const {user}=useAuth()
  const [jobs,setJobs]=useState<RadarJob[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [appliedToday,setAppliedToday]=useState(0)
  const [dailyGoal,setDailyGoal]=useState(5)
  const bootstrapped=useRef<string|null>(null)

  const refresh=useCallback(async()=>{
    if(!user)return 0
    setLoading(true);setError(null)
    const now=new Date()
    const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())).toISOString()
    const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1)).toISOString()
    const [jobsResult,countResult,preferencesResult]=await Promise.all([
      supabase.from('jobs').select(`id,title,company,location,fully_remote,employment_type,salary,description,requirements,skills,application_url,canonical_url,application_method,application_email,application_instructions,posted_at,last_verified_at,source_count,job_sources(name),user_job_matches!inner(fit_score,why_match,missing_skills),application_progress(saved,stage,applied_at,notes)`).order('posted_at',{ascending:false,nullsFirst:false}).limit(150),
      supabase.from('application_progress').select('job_id',{count:'exact',head:true}).gte('applied_at',start).lt('applied_at',end),
      supabase.from('preferences').select('daily_application_goal').eq('user_id',user.id).single(),
    ])
    let count=0
    if(jobsResult.error)setError(jobsResult.error.message)
    else{const next=(jobsResult.data??[]) as unknown as RadarJob[];setJobs(next);count=next.length}
    if(!countResult.error)setAppliedToday(countResult.count??0)
    if(!preferencesResult.error)setDailyGoal(Math.min(5,Math.max(1,preferencesResult.data.daily_application_goal??5)))
    setLoading(false)
    return count
  },[user])

  useEffect(()=>{
    if(!user)return
    if(bootstrapped.current===user.id){void refresh();return}
    bootstrapped.current=user.id
    void (async()=>{
      const count=await refresh()
      if(count===0){
        const {error:matchError}=await supabase.functions.invoke('match-user-jobs',{body:{}})
        if(matchError)setError(matchError.message)
        else await refresh()
      }
    })()
  },[user,refresh])

  const runMatching=async()=>{const {error}=await supabase.functions.invoke('match-user-jobs',{body:{}});if(error)throw error;await refresh()}
  const updateProgress=async(jobId:string,patch:{saved?:boolean;stage?:ApplicationStage;notes?:string|null})=>{
    if(!user)throw new Error('Not signed in')
    const payload={user_id:user.id,job_id:jobId,...patch,updated_at:new Date().toISOString(),...(patch.stage==='applied'?{applied_at:new Date().toISOString()}:{})}
    const {error}=await supabase.from('application_progress').upsert(payload,{onConflict:'user_id,job_id'})
    if(error)throw error
    await refresh()
  }
  return {jobs,loading,error,appliedToday,dailyGoal,refresh,runMatching,updateProgress}
}
