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

  const url = Deno.env.get('SUPABASE_URL')!
  const publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default
  if (!publishable) return json({ error: 'Supabase publishable key is unavailable' }, 500)

  const client = createClient(url, publishable, { global: { headers: { Authorization: auth } } })
  const { data: { user }, error: userError } = await client.auth.getUser(token)
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)

  const body = await req.json().catch(() => ({})) as { resumeId?: string }
  if (!body.resumeId) return json({ error: 'resumeId is required' }, 400)

  const { data: resume, error: resumeError } = await client
    .from('user_resumes')
    .select('id,storage_path,content_type')
    .eq('id', body.resumeId)
    .eq('user_id', user.id)
    .single()

  if (resumeError || !resume) return json({ error: resumeError?.message ?? 'Resume not found' }, 404)

  if (resume.content_type !== 'text/plain') {
    return json({ parsed: false, reason: 'PDF/DOCX extraction is not enabled yet. Matching will use profile skills and target roles.' })
  }

  const { data: file, error: downloadError } = await client.storage.from('resumes').download(resume.storage_path)
  if (downloadError || !file) return json({ error: downloadError?.message ?? 'Could not download resume' }, 500)

  const extractedText = await file.text()
  const { error: updateError } = await client
    .from('user_resumes')
    .update({ extracted_text: extractedText, updated_at: new Date().toISOString() })
    .eq('id', resume.id)
    .eq('user_id', user.id)

  if (updateError) return json({ error: updateError.message }, 500)
  return json({ parsed: true, characters: extractedText.length })
})
