export const DAILY_APPLICATION_CAP=5
export function canMarkApplied(appliedToday:number,wasAlreadyApplied:boolean){return wasAlreadyApplied||appliedToday<DAILY_APPLICATION_CAP}
