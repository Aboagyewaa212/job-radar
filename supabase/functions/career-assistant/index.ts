import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

type Mode = 'resume' | 'cover_letter'
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const topSkills=(job:any,match:any,profile:any)=>[...(match?.why_match??[]),...(job?.skills??[]),...(profile?.skills??[])].map(String).map(v=>v.trim()).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,8)
function extractResponseText(payload:any){for(const item of payload?.output??[]){for(const part of item?.content??[]){if(part?.type==='output_text'&&typeof part.text==='string')return part.text}}return ''}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  const auth=req.headers.get('Authorization')??'';const token=auth.replace(/^Bearer\s+/i,'')
  if(!token)return json({error:'Unauthorized'},401)
  const url=Deno.env.get('SUPABASE_URL')!,publishable=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')??'{}').default,secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')??'{}').default
  if(!publishable||!secret)return json({error:'Supabase function keys unavailable'},500)
  const client=createClient(url,publishable,{global:{headers:{Authorization:auth}}})
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const{data:{user},error:userError}=await client.auth.getUser(token);if(userError||!user)return json({error:'Unauthorized'},401)

  const hourAgo=new Date(Date.now()-60*60*1000).toISOString(),dayAgo=new Date(Date.now()-24*60*60*1000).toISOString()
  const[hourUsage,dayUsage]=await Promise.all([
    admin.from('function_usage').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('action','career_assistant').gte('created_at',hourAgo),
    admin.from('function_usage').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('action','career_assistant').gte('created_at',dayAgo),
  ])
  if(hourUsage.error||dayUsage.error)return json({error:'Usage guard unavailable'},500)
  if((hourUsage.count??0)>=20||(dayUsage.count??0)>=100)return json({error:'Assistant usage limit reached. Try again later.'},429)

  let body:any={};try{body=await req.json()}catch{return json({error:'Invalid JSON body'},400)}
  const mode:Mode=body?.mode==='cover_letter'?'cover_letter':'resume';const jobId=String(body?.jobId??'').trim();const rawSource=String(body?.sourceText??'');const rawNotes=String(body?.instructions??'')
  if(!jobId||jobId.length>100)return json({error:'A valid jobId is required'},400)
  if(rawSource.length>60000)return json({error:'Source resume text is too large'},413)
  if(rawNotes.length>2000)return json({error:'Instructions are too large'},413)
  const sourceText=rawSource.trim(),userNotes=rawNotes.trim()

  const[{data:job,error:jobError},{data:profile},{data:match},{data:resume}]=await Promise.all([
    client.from('jobs').select('id,title,company,description,requirements,skills,application_url').eq('id',jobId).single(),
    client.from('profiles').select('display_name,skills,target_fields').eq('user_id',user.id).single(),
    client.from('user_job_matches').select('why_match,missing_skills,fit_score').eq('user_id',user.id).eq('job_id',jobId).maybeSingle(),
    client.from('user_resumes').select('extracted_text').eq('user_id',user.id).eq('is_primary',true).maybeSingle(),
  ])
  if(jobError||!job)return json({error:jobError?.message??'Job not found'},404)
  const source=sourceText||String(resume?.extracted_text??'').trim();if(!source)return json({error:'Add or paste your source resume text first.'},409)

  const{error:usageError}=await admin.from('function_usage').insert({user_id:user.id,action:'career_assistant'})
  if(usageError)return json({error:'Could not record assistant usage'},500)

  const skills=topSkills(job,match,profile)
  const openaiKey=Deno.env.get('OPENAI_API_KEY')
  if(!openaiKey)return json({error:'AI drafting is not configured yet. Add an OpenAI API key to the Supabase Edge Function secrets.'},503)

  const instructions=mode==='resume'
    ? `You are a career application editor. Create a polished, ATS-friendly tailored CV in plain text from the source CV and job description.

Rules:
- Never invent employers, dates, degrees, certifications, metrics, tools, responsibilities, achievements, or skills.
- Preserve factual employers, roles, dates, education, and contact details exactly when they appear in the source CV.
- Rewrite and reorder content so the most relevant experience appears first.
- Improve bullet wording for clarity and impact, but every claim must be supported by the source CV.
- Do not paste large raw sections from the source CV. Synthesize and rewrite them.
- Do not copy more than 12 consecutive words from the source CV unless they are proper nouns, official role titles, organization names, degree names, or dates.
- Use terminology from the job description only when it accurately describes the candidate's existing experience.
- Remove irrelevant detail where appropriate, but do not remove important dates, employers, education, or core experience.
- Output only the finished CV. Do not include explanations, tailoring notes, scores, or commentary.`
    : `You are a career application writer. Write a concise, specific cover letter in plain text for this job.

Rules:
- Use only factual evidence supported by the source CV.
- Never invent employers, dates, degrees, certifications, metrics, tools, responsibilities, achievements, or skills.
- Do not paste raw CV sections into the letter.
- Do not copy more than 12 consecutive words from the source CV unless they are proper nouns, official role titles, organization names, degree names, or dates.
- Synthesize the candidate's experience into natural prose that explains why it is relevant to this role.
- Do not include contact details, LinkedIn URLs, CV headings, or a list of keywords in the body.
- Avoid generic filler such as "I am writing to express my interest" and avoid exaggerated enthusiasm.
- Use 3 to 4 short paragraphs and approximately 220 to 320 words.
- Paragraph 1: concise reason for applying and strongest fit.
- Middle paragraphs: 2 or 3 concrete, relevant examples from the source CV, rewritten naturally and connected to the job's needs.
- Final paragraph: brief close and interest in discussing the role.
- Output only the finished cover letter.`

  const input=`JOB DATA
Title: ${job.title}
Company: ${job.company}
Skills: ${(job.skills??[]).join(', ')}
Requirements: ${JSON.stringify(job.requirements??[])}
Description: ${String(job.description??'').slice(0,12000)}

SOURCE CV
${source.slice(0,30000)}

USER NOTES
${userNotes||'None'}`

  let content=''
  try{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:Deno.env.get('OPENAI_MODEL')||'gpt-6-luna',
        store:false,
        instructions,
        input,
      }),
    })
    if(!response.ok){
      console.error('OpenAI response',response.status,await response.text())
      return json({error:'The AI drafting service is temporarily unavailable. Please try again.'},502)
    }
    content=extractResponseText(await response.json()).trim()
  }catch(error){
    console.error('OpenAI request failed',error)
    return json({error:'The AI drafting service is temporarily unavailable. Please try again.'},502)
  }
  if(!content)return json({error:'The AI returned an empty draft. Please try again.'},502)
  const generationMode='openai'
  if(mode==='resume'){const{error}=await client.from('tailored_resumes').upsert({user_id:user.id,job_id:jobId,content,keywords:skills,change_notes:['No unsupported facts added.','Review before submitting.'],generation_mode:generationMode,updated_at:new Date().toISOString()},{onConflict:'user_id,job_id'});if(error)return json({error:error.message},500)}else{const{error}=await client.from('cover_letters').upsert({user_id:user.id,job_id:jobId,content,generation_mode:generationMode,updated_at:new Date().toISOString()},{onConflict:'user_id,job_id'});if(error)return json({error:error.message},500)}
  return json({content,generationMode,skills})
})
