import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// Production ingestion adapters belong here. Keep source-specific fetch/parsing code isolated and idempotent.
// This function is intentionally not client-facing until approved source/API credentials are configured.
Deno.serve(()=>Response.json({ok:false,error:'No verified source adapters configured yet'},{status:503}))
