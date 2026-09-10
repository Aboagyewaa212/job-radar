import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// Notification transport is intentionally isolated from matching. Add a provider secret server-side before enabling delivery.
Deno.serve(()=>Response.json({ok:false,error:'Notification transport not configured yet'},{status:503}))
