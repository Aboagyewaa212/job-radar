import type {CSSProperties} from 'react'

export function RadrMark({size=34,inverse=false}:{size?:number;inverse?:boolean}){
  const style={
    '--mark-main':inverse?'#ffffff':'var(--logo-text)',
    '--mark-dot':inverse?'#cf86aa':'var(--rose)',
  } as CSSProperties
  return <svg className="radrMark" style={style} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="RADR">
    <path d="M18 48A34 34 0 0 1 52 14h14v13H52A21 21 0 0 0 31 48z" fill="var(--mark-main)"/>
    <path d="M34 84V56a24 24 0 0 1 24-24h8v14h-8a10 10 0 0 0-10 10v28z" fill="var(--mark-main)"/>
    <circle cx="78" cy="22" r="10" fill="var(--mark-dot)"/>
  </svg>
}

export function RadrLogo({inverse=false,compact=false,className=''}:{inverse?:boolean;compact?:boolean;className?:string}){
  const style=inverse?{'--logo-text':'#fff'} as CSSProperties:undefined
  return <span className={`radrLogo ${compact?'compact':''} ${className}`} style={style}>
    <RadrMark size={compact?30:38} inverse={inverse}/>
    {!compact&&<span className="radrWord">radr</span>}
  </span>
}
