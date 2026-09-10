import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  const auth=req.headers.get('Authorization')??'',token=auth.replace(/^Bearer\s+/i,'')
  if(!token)return json({error:'Unauthorized'},401)
  const body=await req.json().catch(()=>({})) as {confirmation?:string}
  if(body.confirmation!=='DELETE')return json({error:'Explicit DELETE confirmation is required'},400)

  const url=Deno.env.get('SUPABASE_URL')!,publishable=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')??'{}').default,secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')??'{}').default
  if(!publishable||!secret)return json({error:'Supabase function keys unavailable'},500)
  const client=createClient(url,publishable,{global:{headers:{Authorization:auth}}})
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const{data:{user},error:userError}=await client.auth.getUser(token)
  if(userError||!user)return json({error:'Unauthorized'},401)

  for(let offset=0;;){
    const{data:files,error:listError}=await admin.storage.from('resumes').list(user.id,{limit:100,offset,sortBy:{column:'name',order:'asc'}})
    if(listError)return json({error:'Could not enumerate private resume files'},500)
    const names=(files??[]).filter(file=>file.name&&file.id).map(file=>`${user.id}/${file.name}`)
    if(names.length){const{error:removeError}=await admin.storage.from('resumes').remove(names);if(removeError)return json({error:'Could not remove private resume files'},500)}
    if((files??[]).length<100)break
    offset+=100
  }

  const{error:deleteError}=await admin.auth.admin.deleteUser(user.id)
  if(deleteError)return json({error:'Could not delete account'},500)
  return json({ok:true})
})
