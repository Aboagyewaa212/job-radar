import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const normalize = (value: unknown): string[] => Array.isArray(value) ? value.map(String).map(v => v.trim().toLowerCase()).filter(Boolean) : []
const words=(value:string)=>value.split(/[^a-z0-9+#.]+/).map(v=>v.trim()).filter(v=>v.length>=3)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const auth = req.headers.get('Authorization') ?? '', token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  const url = Deno.env.get('SUPABASE_URL')!, publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default, secret = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default
  if (!publishable || !secret) return json({ error: 'Supabase function keys are unavailable' }, 500)
  const userClient = createClient(url, publishable, { global: { headers: { Authorization: auth } } })
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const { data: { user }, error: userError } = await userClient.auth.getUser(token)
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)
  const [profileResult, preferencesResult, resumeResult] = await Promise.all([
    userClient.from('profiles').select('*').eq('user_id', user.id).single(),
    userClient.from('preferences').select('*').eq('user_id', user.id).single(),
    userClient.from('user_resumes').select('extracted_text').eq('user_id', user.id).eq('is_primary', true).maybeSingle(),
  ])
  if (profileResult.error) return json({ error: profileResult.error.message }, 500)
  if (preferencesResult.error) return json({ error: preferencesResult.error.message }, 500)
  const profile = profileResult.data, preferences = preferencesResult.data, resumeText = (resumeResult.data?.extracted_text ?? '').toLowerCase()
  const evidence = new Set([...normalize(profile?.skills), ...normalize(preferences?.target_roles), ...normalize(profile?.target_fields)])
  for (const tokenPart of words(resumeText)) evidence.add(tokenPart)
  const { data: jobs, error: jobsError } = await admin.from('jobs').select('id,title,company,location,remote_scope,fully_remote,description,requirements,skills,status,posted_at,job_sources(name)').eq('status', 'active').order('posted_at', { ascending: false, nullsFirst: false }).limit(1500)
  if (jobsError) return json({ error: jobsError.message }, 500)
  const excluded = normalize(preferences?.excluded_keywords), preferredSources = normalize(preferences?.preferred_sources), targetRoles = normalize(preferences?.target_roles)
  const targetTokens=[...new Set(targetRoles.flatMap(words))]
  const candidates = (jobs ?? []).map((job: any) => {
    const sourceName = String(job.job_sources?.name ?? '').toLowerCase()
    if (preferredSources.length && !preferredSources.some(source => sourceName.includes(source) || source.includes(sourceName))) return null
    const jobSkills = normalize(job.skills), title=String(job.title??'').toLowerCase(), text = `${job.title ?? ''} ${job.company ?? ''} ${job.description ?? ''} ${JSON.stringify(job.requirements ?? [])}`.toLowerCase()
    if (excluded.some(keyword => keyword && text.includes(keyword))) return null
    if (preferences?.remote_only && !job.fully_remote) return null
    const matched = [...evidence].filter(skill => skill.length > 2 && (jobSkills.includes(skill) || text.includes(skill))).slice(0, 16)
    const missing = jobSkills.filter((skill: string) => !evidence.has(skill) && !resumeText.includes(skill)).slice(0, 8)
    const skillScore = jobSkills.length ? Math.round((matched.length / Math.max(jobSkills.length, 1)) * 60) : Math.min(matched.length * 7, 45)
    const remoteBonus = preferences?.remote_only ? 15 : (job.fully_remote ? 5 : 0)
    const exactRole = targetRoles.some(role => title.includes(role))
    const tokenHits = targetTokens.filter(token=>title.includes(token)).length
    const roleBonus = exactRole ? 25 : Math.min(tokenHits * 8, 20)
    const recencyBonus = job.posted_at && Date.now()-new Date(job.posted_at).getTime() < 14*86400000 ? 5 : 0
    const fit = Math.max(0, Math.min(100, skillScore + remoteBonus + roleBonus + recencyBonus))
    return { user_id: user.id, job_id: job.id, fit_score: fit, why_match: matched.slice(0, 5), missing_skills: missing, matched_at: new Date().toISOString() }
  }).filter(Boolean) as Array<{user_id:string;job_id:string;fit_score:number;why_match:string[];missing_skills:string[];matched_at:string}>

  const minimum=Number(preferences?.minimum_fit_score ?? 60)
  let rows=candidates.filter(row=>row.fit_score>=minimum)
  let fallback=false
  if(!rows.length && candidates.length){
    rows=[...candidates].sort((a,b)=>b.fit_score-a.fit_score).slice(0,25)
    fallback=true
  }

  const { error: clearError } = await admin.from('user_job_matches').delete().eq('user_id', user.id)
  if (clearError) return json({ error: clearError.message }, 500)
  if (rows.length) { const { error } = await admin.from('user_job_matches').insert(rows); if (error) return json({ error: error.message }, 500) }
  const strongest = [...rows].sort((a, b) => b.fit_score - a.fit_score).slice(0, 10)
  return json({ matched: rows.length, strongest, fallback, requestedMinimum: minimum })
})
