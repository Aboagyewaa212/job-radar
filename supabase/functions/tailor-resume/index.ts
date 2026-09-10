import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default
  const url = Deno.env.get('SUPABASE_URL')!
  if (!publishable) return json({ error: 'Supabase publishable key is unavailable' }, 500)

  const client = createClient(url, publishable, { global: { headers: { Authorization: auth } } })
  const { data: { user }, error: userError } = await client.auth.getUser(token)
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)

  const body = await req.json().catch(() => ({})) as { jobId?: string }
  if (!body.jobId) return json({ error: 'jobId is required' }, 400)

  const [{ data: resume, error: resumeError }, { data: job, error: jobError }] = await Promise.all([
    client.from('user_resumes').select('extracted_text').eq('user_id', user.id).eq('is_primary', true).maybeSingle(),
    client.from('jobs').select('skills,title,company').eq('id', body.jobId).single(),
  ])

  if (resumeError) return json({ error: resumeError.message }, 500)
  if (jobError || !job) return json({ error: jobError?.message ?? 'Job not found' }, 404)
  if (!resume?.extracted_text) return json({ error: 'Primary resume has not been parsed yet' }, 409)

  const keywords = Array.isArray(job.skills) ? job.skills.slice(0, 12) : []
  const content = resume.extracted_text
  const changeNotes = [
    'Truthful fallback tailoring: original resume preserved verbatim.',
    `Relevant keywords identified for ${job.title} at ${job.company}.`,
    'No experience, education, skills, dates, metrics, or credentials were fabricated.',
  ]

  const { error } = await client.from('tailored_resumes').upsert({
    user_id: user.id,
    job_id: body.jobId,
    content,
    keywords,
    change_notes: changeNotes,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,job_id' })

  if (error) return json({ error: error.message }, 500)
  return json({ content, keywords, change_notes: changeNotes })
})
