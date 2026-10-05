export default function Alert({title,children,tone='info'}:{title?:string;children:React.ReactNode;tone?:'info'|'warning'|'error'|'success'}){
 return <div className={`ccAlert ccAlert--${tone}`} role={tone==='error'?'alert':'note'}><span className="ccAlert__icon" aria-hidden="true">{tone==='success'?'✓':'i'}</span><div>{title&&<strong>{title}</strong>}{children}</div></div>;
}
