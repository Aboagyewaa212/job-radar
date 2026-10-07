import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const normalize=(value:unknown):string[]=>Array.isArray(value)?value.map(String).map(v=>v.trim().toLowerCase()).filter(Boolean):[]
const STOPWORDS=new Set('and the for with from that this your you our are was were have has had into using use used work working role roles job jobs experience experienced responsible responsibilities including include through about across within will can skills skill years year team teams support supported supporting'.split(' '))
const words=(value:string)=>value.split(/[^a-z0-9+#.]+/).map(v=>v.trim()).filter(v=>v.length>=3&&!STOPWORDS.has(v))
const resumeKeywords=(value:string)=>{const counts=new Map<string,number>();for(const token of words(value)){if(/^\d+$/.test(token)||token.length>32)continue;counts.set(token,(counts.get(token)??0)+1)}return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,80).map(([token])=>token)}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return json({error:'Method not allowed'},405)
  const auth=req.headers.get('Authorization')??'',token=auth.replace(/^Bearer\s+/i,'');if(!token)return json({error:'Unauthorized'},401)
  const url=Deno.env.get('SUPABASE_URL')!,publishable=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')??'{}').default,secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')??'{}').default;if(!publishable||!secret)return json({error:'Supabase function keys unavailable'},500)
  const userClient=createClient(url,publishable,{global:{headers:{Authorization:auth}}}),admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});const{data:{user},error:userError}=await userClient.auth.getUser(token);if(userError||!user)return json({error:'Unauthorized'},401)
  const hourAgo=new Date(Date.now()-3600000).toISOString();const{count,error:usageReadError}=await admin.from('function_usage').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('action','match_jobs').gte('created_at',hourAgo);if(usageReadError)return json({error:'Usage guard unavailable'},500);if((count??0)>=30)return json({error:'Match refresh limit reached. Try again later.'},429)
  const[profileResult,preferencesResult,resumeResult]=await Promise.all([userClient.from('profiles').select('*').eq('user_id',user.id).single(),userClient.from('preferences').select('*').eq('user_id',user.id).single(),userClient.from('user_resumes').select('extracted_text').eq('user_id',user.id).eq('is_primary',true).maybeSingle()]);if(profileResult.error)return json({error:profileResult.error.message},500);if(preferencesResult.error)return json({error:preferencesResult.error.message},500)
  const profile=profileResult.data,preferences=preferencesResult.data,resumeText=(resumeResult.data?.extracted_text??'').toLowerCase(),cvKeywords=resumeKeywords(resumeText),evidence=new Set([...normalize(profile?.skills),...normalize(preferences?.target_roles),...normalize(profile?.target_fields),...cvKeywords]);for(const tokenPart of words(resumeText))evidence.add(tokenPart)
  const{data:jobs,error:jobsError}=await admin.from('jobs').select('id,title,company,location,remote_scope,fully_remote,description,requirements,skills,status,posted_at,job_sources(name)').eq('status','active').order('posted_at',{ascending:false,nullsFirst:false}).limit(1500);if(jobsError)return json({error:jobsError.message},500)
  const excluded=normalize(preferences?.excluded_keywords),targetRoles=normalize(preferences?.target_roles),targetTokens=[...new Set(targetRoles.flatMap(words))]
  const profileSkills=normalize(profile?.skills),profileFields=normalize(profile?.target_fields)
  const evidenceTerms=[...new Set([...profileSkills,...profileFields,...cvKeywords])].filter(term=>term.length>=3).slice(0,120)
  const candidates=(jobs??[]).map((job:any)=>{
    const jobSkills=normalize(job.skills),title=String(job.title??'').toLowerCase(),text=`${job.title??''} ${job.company??''} ${job.description??''} ${JSON.stringify(job.requirements??[])}`.toLowerCase()
    if(excluded.some(keyword=>keyword&&text.includes(keyword)))return null
    if(preferences?.remote_only&&!job.fully_remote)return null
    const matchedTerms=evidenceTerms.filter(term=>text.includes(term))
    const matchedSkills=jobSkills.filter((skill:string)=>evidence.has(skill)||resumeText.includes(skill))
    const missing=jobSkills.filter((skill:string)=>!evidence.has(skill)&&!resumeText.includes(skill)).slice(0,8)
    const exactRole=targetRoles.some(role=>role&&title.includes(role))
    const titleTokenHits=targetTokens.filter(token=>title.includes(token)).length
    const roleCoverage=targetTokens.length?titleTokenHits/targetTokens.length:0
    const roleScore=exactRole?40:Math.round(Math.min(1,roleCoverage)*35)
    const skillScore=jobSkills.length?Math.round((matchedSkills.length/Math.max(jobSkills.length,1))*35):Math.round(Math.min(1,matchedTerms.length/10)*25)
    const evidenceScore=Math.min(15,matchedTerms.length*2)
    const recencyScore=job.posted_at&&Date.now()-new Date(job.posted_at).getTime()<14*86400000?5:0
    const remoteScore=job.fully_remote?5:0
    const fit=Math.max(0,Math.min(100,roleScore+skillScore+evidenceScore+recencyScore+remoteScore))
    const why=[...new Set([...matchedSkills,...matchedTerms])].slice(0,5)
    return{user_id:user.id,job_id:job.id,fit_score:fit,why_match:why,missing_skills:missing,matched_at:new Date().toISOString()}
  }).filter(Boolean) as Array<{user_id:string;job_id:string;fit_score:number;why_match:string[];missing_skills:string[];matched_at:string}>
  const minimum=Math.max(0,Math.min(100,Number(preferences?.minimum_fit_score??60)))
  const rows=candidates.filter(row=>row.fit_score>=minimum)
  const{error:usageError}=await admin.from('function_usage').insert({user_id:user.id,action:'match_jobs'});if(usageError)return json({error:'Could not record match usage'},500)
  const{error:clearError}=await admin.from('user_job_matches').delete().eq('user_id',user.id);if(clearError)return json({error:clearError.message},500);if(rows.length){const{error}=await admin.from('user_job_matches').insert(rows);if(error)return json({error:error.message},500)}const strongest=[...rows].sort((a,b)=>b.fit_score-a.fit_score).slice(0,10);return json({matched:rows.length,strongest,requestedMinimum:minimum})
})
