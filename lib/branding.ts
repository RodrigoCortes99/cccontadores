/** Only an explicitly configured public website may become the vendor link. */
export function vendorWebsite(value:string|undefined):string|null {
  if(!value)return null;
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export const carovaPublicUrl=vendorWebsite(process.env.NEXT_PUBLIC_CAROVA_PUBLIC_URL);

/** Environment tags are presentation-only and require explicit public configuration. */
export function environmentLabel(value:string|undefined):string|null {
  const labels:Record<string,string>={demo:'Demostración',demonstration:'Demostración',test:'Pruebas',testing:'Pruebas',development:'Desarrollo',dev:'Desarrollo'};
  return labels[value?.trim().toLowerCase()||'']||null;
}
export const publicEnvironmentLabel=environmentLabel(process.env.NEXT_PUBLIC_APP_ENVIRONMENT);
