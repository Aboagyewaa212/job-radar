import {useEffect,useMemo,useRef,useState} from 'react'
import {Bot,CheckCircle2,Download,FileText,LoaderCircle,RefreshCw,Sparkles,Upload} from 'lucide-react'
import {supabase} from '../services/supabase'
import {useAuth} from '../hooks/useAuth'

type Resume={
  id:string
  original_filename:string
  storage_path:string
  content_type:string
  extracted_text:string|null
  updated_at?:string
}
type MatchJob={job_id:string;fit_score:number;jobs:{id:string;title:string;company:string}|null}
type DocumentMode='resume'|'cover_letter'
type Drafts={resume:string;cover_letter:string}
type Modes={resume:string;cover_letter:string}

const MAX_RESUME_BYTES=10*1024*1024
const ALLOWED_EXTENSIONS=['.pdf','.docx','.txt']

function validResumeFile(file:File){
  const name=file.name.toLowerCase()
  return file.size<=MAX_RESUME_BYTES&&ALLOWED_EXTENSIONS.some(ext=>name.endsWith(ext))
}

export default function ResumePage(){
  const{user}=useAuth()
  const[resume,setResume]=useState<Resume|null>(null)
  const[file,setFile]=useState<File|null>(null)
  const[jobs,setJobs]=useState<MatchJob[]>([])
  const[selectedJobId,setSelectedJobId]=useState('')
  const[instructions,setInstructions]=useState('')
  const[drafts,setDrafts]=useState<Drafts>({resume:'',cover_letter:''})
  const[generationModes,setGenerationModes]=useState<Modes>({resume:'',cover_letter:''})
  const[activeDocument,setActiveDocument]=useState<DocumentMode>('resume')
  const[uploading,setUploading]=useState(false)
  const[matching,setMatching]=useState(false)
  const[generating,setGenerating]=useState<DocumentMode|null>(null)
  const[saving,setSaving]=useState(false)
  const[error,setError]=useState('')
  const fileInput=useRef<HTMLInputElement|null>(null)

  const selectedJob=useMemo(()=>jobs.find(job=>job.job_id===selectedJobId)??null,[jobs,selectedJobId])
  const hasParsedCv=Boolean(resume?.extracted_text?.trim())
  const activeDraft=drafts[activeDocument]
  const activeMode=generationModes[activeDocument]

  async function loadResume(){
    if(!user)return
    const{data,error}=await supabase.from('user_resumes')
      .select('id,original_filename,storage_path,content_type,extracted_text,updated_at')
      .eq('user_id',user.id)
      .eq('is_primary',true)
      .maybeSingle()
    if(error){setError(error.message);return}
    setResume(data as Resume|null)
  }

  async function loadJobs(){
    if(!user)return
    const{data,error}=await supabase.from('user_job_matches')
      .select('job_id,fit_score,jobs(id,title,company)')
      .eq('user_id',user.id)
      .order('fit_score',{ascending:false})
      .limit(80)
    if(error){setError(error.message);return}
    const next=(data??[]) as unknown as MatchJob[]
    setJobs(next)
    setSelectedJobId(current=>current&&next.some(job=>job.job_id===current)?current:(next[0]?.job_id??''))
  }

  async function loadDocuments(jobId:string){
    if(!user||!jobId){
      setDrafts({resume:'',cover_letter:''})
      setGenerationModes({resume:'',cover_letter:''})
      return
    }
    const[resumeResult,coverResult]=await Promise.all([
      supabase.from('tailored_resumes').select('content,generation_mode').eq('user_id',user.id).eq('job_id',jobId).maybeSingle(),
      supabase.from('cover_letters').select('content,generation_mode').eq('user_id',user.id).eq('job_id',jobId).maybeSingle(),
    ])
    if(resumeResult.error){setError(resumeResult.error.message);return}
    if(coverResult.error){setError(coverResult.error.message);return}
    const resumeMode=String(resumeResult.data?.generation_mode??'')
    const coverMode=String(coverResult.data?.generation_mode??'')
    const resumeContent=resumeMode==='structured'?'':String(resumeResult.data?.content??'')
    const coverContent=coverMode==='structured'?'':String(coverResult.data?.content??'')
    setDrafts({resume:resumeContent,cover_letter:coverContent})
    setGenerationModes({
      resume:resumeContent?resumeMode:'',
      cover_letter:coverContent?coverMode:'',
    })
    if(coverContent&&!resumeContent)setActiveDocument('cover_letter')
    else setActiveDocument('resume')
  }

  useEffect(()=>{void loadResume();void loadJobs()},[user])
  useEffect(()=>{void loadDocuments(selectedJobId)},[selectedJobId,user])

  async function replaceResume(){
    if(!user||!file||uploading)return
    if(!validResumeFile(file)){setError('Use a PDF, DOCX, or TXT file no larger than 10 MB.');return}
    setUploading(true);setError('')
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
    const path=`${user.id}/${crypto.randomUUID()}-${safe}`
    let uploaded=false
    let oldDisabled=false
    try{
      const{error:uploadError}=await supabase.storage.from('resumes').upload(path,file,{contentType:file.type||'application/octet-stream'})
      if(uploadError)throw uploadError
      uploaded=true
      if(resume){
        const{error}=await supabase.from('user_resumes').update({is_primary:false,updated_at:new Date().toISOString()}).eq('id',resume.id).eq('user_id',user.id)
        if(error)throw error
        oldDisabled=true
      }
      const{data:newResume,error:insertError}=await supabase.from('user_resumes').insert({
        user_id:user.id,
        original_filename:file.name,
        storage_path:path,
        content_type:file.type||'application/octet-stream',
        is_primary:true,
      }).select('id').single()
      if(insertError)throw insertError

      const{error:parseError}=await supabase.functions.invoke('parse-resume',{body:{resumeId:newResume.id}})
      if(parseError)throw parseError

      setFile(null)
      if(fileInput.current)fileInput.current.value=''
      await loadResume()
      await refreshMatches()
    }catch(error){
      if(uploaded)await supabase.storage.from('resumes').remove([path])
      if(resume&&oldDisabled)await supabase.from('user_resumes').update({is_primary:true,updated_at:new Date().toISOString()}).eq('id',resume.id).eq('user_id',user.id)
      setError(error instanceof Error?error.message:'Could not upload your CV')
    }finally{
      setUploading(false)
    }
  }

  async function refreshMatches(){
    if(!user||matching)return
    setMatching(true);setError('')
    try{
      const{data,error}=await supabase.functions.invoke('match-user-jobs',{body:{}})
      if(error)throw error
      if(typeof data?.matched!=='number')throw new Error('RADR could not refresh your matched jobs.')
      await loadJobs()
    }catch(error){
      setError(error instanceof Error?error.message:'Could not refresh matched jobs')
    }finally{
      setMatching(false)
    }
  }

  async function generate(mode:DocumentMode){
    if(!selectedJobId){setError('Choose a job first.');return}
    if(!resume){setError('Upload your CV first.');return}
    if(!hasParsedCv){setError('RADR could not read this CV. Replace it with a text-based PDF, DOCX, or TXT file.');return}
    setGenerating(mode);setActiveDocument(mode);setError('')
    try{
      const{data,error}=await supabase.functions.invoke('career-assistant',{
        body:{jobId:selectedJobId,mode,instructions},
      })
      if(error)throw error
      const content=String(data?.content??'').trim()
      if(!content)throw new Error('The assistant returned an empty draft.')
      setDrafts(current=>({...current,[mode]:content}))
      setGenerationModes(current=>({...current,[mode]:String(data?.generationMode??'openai')}))
    }catch(error){
      setError(error instanceof Error?error.message:'Could not generate the document')
    }finally{
      setGenerating(null)
    }
  }

  async function saveDraft(){
    if(!user||!selectedJobId||!activeDraft.trim()||saving)return
    setSaving(true);setError('')
    const now=new Date().toISOString()
    try{
      if(activeDocument==='resume'){
        const{error}=await supabase.from('tailored_resumes').upsert({
          user_id:user.id,
          job_id:selectedJobId,
          content:activeDraft.trim(),
          keywords:[],
          change_notes:['Edited and saved by user.'],
          generation_mode:activeMode||'edited',
          updated_at:now,
        },{onConflict:'user_id,job_id'})
        if(error)throw error
      }else{
        const{error}=await supabase.from('cover_letters').upsert({
          user_id:user.id,
          job_id:selectedJobId,
          content:activeDraft.trim(),
          generation_mode:activeMode||'edited',
          updated_at:now,
        },{onConflict:'user_id,job_id'})
        if(error)throw error
      }
    }catch(error){
      setError(error instanceof Error?error.message:'Could not save your edits')
    }finally{
      setSaving(false)
    }
  }

  function downloadDraft(){
    if(!activeDraft)return
    const blob=new Blob([activeDraft],{type:'text/plain;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download=`${activeDocument==='resume'?'tailored-resume':'cover-letter'}-${selectedJob?.jobs?.company??'job'}.txt`.replace(/[^a-zA-Z0-9._-]/g,'-')
    a.click()
    URL.revokeObjectURL(url)
  }

  return <>
    <header className="pageHeader cleanHeader">
      <div><h1>Resume Studio</h1><p className="pageHeaderNote">Your CV stays in the background while RADR helps you prepare each application.</p></div>
    </header>

    <div className="resumeStudioWorkspace">
      <aside className="resumeStudioSetup">
        <section className="studioCard">
          <div className="studioCardHeading">
            <div className="studioIcon"><FileText size={18}/></div>
            <div><span className="studioEyebrow">Your CV</span><h2>{resume?.original_filename??'Add your CV'}</h2></div>
          </div>

          {resume&&<div className={hasParsedCv?'cvReady':'cvWarning'}>
            {hasParsedCv?<CheckCircle2 size={17}/>:<FileText size={17}/>}
            <span>{hasParsedCv?'CV ready for matching and tailoring':'CV uploaded, but text could not be read'}</span>
          </div>}

          <input ref={fileInput} className="visuallyHidden" type="file" accept=".pdf,.docx,.txt" onChange={e=>setFile(e.target.files?.[0]??null)}/>
          <button className="btn secondary studioFullButton" type="button" disabled={uploading} onClick={()=>fileInput.current?.click()}>
            <Upload size={15}/>{resume?'Replace CV':'Choose CV'}
          </button>
          {file&&<div className="pendingFile"><span>{file.name}</span><button className="btn primary" type="button" disabled={uploading} onClick={()=>void replaceResume()}>{uploading?<><LoaderCircle className="spin" size={15}/>Reading CV…</>:<><Upload size={15}/>Use this CV</>}</button></div>}
          <p className="finePrint">PDF, DOCX or TXT · up to 10 MB. RADR extracts the text privately and uses it in the background.</p>
        </section>

        <section className="studioCard">
          <div className="studioCardHeading">
            <div className="studioStep">2</div>
            <div><span className="studioEyebrow">Job</span><h2>Choose a RADR match</h2></div>
          </div>

          {jobs.length>0?<label className="studioJobSelect">Matched job
            <select value={selectedJobId} onChange={e=>setSelectedJobId(e.target.value)}>
              {jobs.map(item=><option key={item.job_id} value={item.job_id}>{item.jobs?.title??'Job'} — {item.jobs?.company??'Company'} · {item.fit_score}%</option>)}
            </select>
          </label>:<div className="studioEmptyState">No matched jobs are available yet.</div>}

          <button className="textButton studioRefresh" type="button" disabled={matching} onClick={()=>void refreshMatches()}>
            <RefreshCw className={matching?'spin':''} size={14}/>{matching?'Refreshing matches…':'Refresh matched jobs'}
          </button>

          {selectedJob&&<div className="selectedStudioJob">
            <div><b>{selectedJob.jobs?.title}</b><span>{selectedJob.jobs?.company}</span></div>
            <strong>{selectedJob.fit_score}%</strong>
          </div>}
        </section>
      </aside>

      <section className="studioAssistant">
        <div className="assistantHeader">
          <div className="assistantAvatar"><Bot size={20}/></div>
          <div><span className="studioEyebrow">RADR Assistant</span><h2>Prepare this application</h2><p>I’ll use your saved CV and the selected job. I won’t add experience you haven’t provided.</p></div>
        </div>

        <div className="assistantPrompt">
          <label>Anything you want me to emphasize?
            <textarea rows={3} maxLength={2000} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Optional — e.g. foreground coordination experience and keep the tone concise."/>
          </label>
        </div>

        <div className="assistantChoiceGrid">
          <button className="assistantChoice" type="button" disabled={!selectedJobId||!hasParsedCv||Boolean(generating)} onClick={()=>void generate('resume')}>
            <Sparkles size={18}/><span><b>Tailor my CV</b><small>Refocus your existing CV for this role.</small></span>
          </button>
          <button className="assistantChoice" type="button" disabled={!selectedJobId||!hasParsedCv||Boolean(generating)} onClick={()=>void generate('cover_letter')}>
            <Sparkles size={18}/><span><b>Draft a cover letter</b><small>Create a job-specific letter from your real experience.</small></span>
          </button>
        </div>

        {generating&&<div className="assistantWorking">
          <LoaderCircle className="spin" size={20}/>
          <div><b>{generating==='resume'?'Tailoring your CV…':'Drafting your cover letter…'}</b><span>Reading the job and comparing it with your saved CV.</span></div>
        </div>}

        {!generating&&!drafts.resume&&!drafts.cover_letter&&<div className="assistantBlank">
          <Sparkles size={22}/>
          <div><b>Your draft will appear here.</b><span>Choose a job, then ask RADR Assistant to create the document you need.</span></div>
        </div>}

        {(drafts.resume||drafts.cover_letter)&&<div className="assistantResult">
          <div className="documentTabs">
            {drafts.resume&&<button type="button" className={activeDocument==='resume'?'active':''} onClick={()=>setActiveDocument('resume')}>Tailored CV</button>}
            {drafts.cover_letter&&<button type="button" className={activeDocument==='cover_letter'?'active':''} onClick={()=>setActiveDocument('cover_letter')}>Cover letter</button>}
          </div>

          <div className="documentToolbar">
            <div><b>{activeDocument==='resume'?'Tailored CV':'Cover letter'}</b>{activeMode&&<span>{activeMode==='openai'?'AI-assisted':'Edited draft'}</span>}</div>
            <div className="assistantActions">
              <button className="btn secondary" type="button" disabled={saving} onClick={()=>void saveDraft()}>{saving?'Saving…':'Save edits'}</button>
              <button className="btn secondary" type="button" onClick={downloadDraft}><Download size={14}/>Download</button>
            </div>
          </div>

          <textarea
            className="documentEditor studioDocumentEditor"
            aria-label={activeDocument==='resume'?'Tailored CV editor':'Cover letter editor'}
            value={activeDraft}
            onChange={e=>setDrafts(current=>({...current,[activeDocument]:e.target.value}))}
          />
        </div>}

        {error&&<div className="studioError" role="alert">{error}</div>}
      </section>
    </div>
  </>
}
