import { corsHeaders } from 'npm:@supabase/supabase-js@2.116.0/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import { extractText } from 'npm:unpdf@1.8.1'
import { unzipSync } from 'npm:fflate@0.8.2'

const MAX_FILE_BYTES=10*1024*1024,MAX_DOC_XML_BYTES=2*1024*1024
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const decodeXml=(value:string)=>value.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)))
function extractDocx(bytes:Uint8Array){const files=unzipSync(bytes,{filter:file=>file.name==='word/document.xml'&&file.originalSize<=MAX_DOC_XML_BYTES});const xmlBytes=files['word/document.xml'];if(!xmlBytes)throw new Error('DOCX text content is missing or too large');const xml=new TextDecoder().decode(xmlBytes);return decodeXml(xml.replace(/<w:tab[^>]*\/>/g,'\t').replace(/<w:br[^>]*\/>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<[^>]+>/g,'')).replace(/\n{3,}/g,'\n\n').trim()}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return json({error:'Method not allowed'},405)
  const auth=req.headers.get('Authorization')??'',token=auth.replace(/^Bearer\s+/i,'');if(!token)return json({error:'Unauthorized'},401)
  const url=Deno.env.get('SUPABASE_URL')!,publishable=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')??'{}').default,secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')??'{}').default;if(!publishable||!secret)return json({error:'Supabase function keys unavailable'},500)
  const client=createClient(url,publishable,{global:{headers:{Authorization:auth}}}),admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});const{data:{user},error:userError}=await client.auth.getUser(token);if(userError||!user)return json({error:'Unauthorized'},401)
  const hourAgo=new Date(Date.now()-3600000).toISOString();const{count,error:usageReadError}=await admin.from('function_usage').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('action','parse_resume').gte('created_at',hourAgo);if(usageReadError)return json({error:'Usage guard unavailable'},500);if((count??0)>=10)return json({error:'Resume parsing limit reached. Try again later.'},429)
  const body=await req.json().catch(()=>({})) as {resumeId?:string};if(!body.resumeId||body.resumeId.length>100)return json({error:'A valid resumeId is required'},400)
  const{data:resume,error:resumeError}=await client.from('user_resumes').select('id,storage_path,content_type,original_filename').eq('id',body.resumeId).eq('user_id',user.id).single();if(resumeError||!resume)return json({error:resumeError?.message??'Resume not found'},404)
  const{data:file,error:downloadError}=await client.storage.from('resumes').download(resume.storage_path);if(downloadError||!file)return json({error:downloadError?.message??'Could not download resume'},500);if(file.size>MAX_FILE_BYTES)return json({error:'Resume file exceeds the 10 MB limit'},413)
  const{error:usageError}=await admin.from('function_usage').insert({user_id:user.id,action:'parse_resume'});if(usageError)return json({error:'Could not record parser usage'},500)
  const bytes=new Uint8Array(await file.arrayBuffer()),name=String(resume.original_filename??'').toLowerCase(),type=String(resume.content_type??'').toLowerCase();let extracted=''
  try{if(type==='text/plain'||name.endsWith('.txt'))extracted=new TextDecoder().decode(bytes);else if(type==='application/pdf'||name.endsWith('.pdf')){const result=await extractText(bytes,{mergePages:true});extracted=Array.isArray(result.text)?result.text.join('\n'):result.text}else if(name.endsWith('.docx')||type.includes('officedocument.wordprocessingml.document'))extracted=extractDocx(bytes);else return json({parsed:false,reason:'This file type is not supported. Upload PDF, DOCX, or TXT.'},415)}catch(error){return json({parsed:false,reason:error instanceof Error?error.message:'Could not extract text from this file'},422)}
  extracted=extracted.replace(/\u0000/g,'').trim().slice(0,60000);if(!extracted)return json({parsed:false,reason:'No readable text was found. If this is a scanned PDF, paste the text manually in Resume Studio.'},422)
  const{error:updateError}=await client.from('user_resumes').update({extracted_text:extracted,updated_at:new Date().toISOString()}).eq('id',resume.id).eq('user_id',user.id);if(updateError)return json({error:updateError.message},500)
  return json({parsed:true,characters:extracted.length})
})
