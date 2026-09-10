import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'

Deno.serve((req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  return new Response(JSON.stringify({error:'This endpoint is retired. Use career-assistant instead.'}),{status:410,headers:{...corsHeaders,'Content-Type':'application/json'}})
})
