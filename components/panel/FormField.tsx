import {useId,isValidElement,cloneElement,type ReactElement} from 'react';
type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export default function FormField({ label, htmlFor, hint, error, required, children }: FormFieldProps) {
  const generated=useId();
  const control=isValidElement(children)?children as ReactElement<{id?:string;'aria-describedby'?:string;'aria-invalid'?:boolean}>:null;
  const id=htmlFor||control?.props.id||generated;
  return (
    <div className="loginField">
      <label htmlFor={id}>
        {label}
        {required && <span className="formField__required"> *</span>}
      </label>
      {control?cloneElement(control,{id,'aria-describedby':hint||error?id+'-help':control.props['aria-describedby'],'aria-invalid':!!error}):children}
      {hint && !error && <span id={id+'-help'} className="formField__hint">{hint}</span>}
      {error && <span id={id+'-help'} role="alert" className="loginError">{error}</span>}
    </div>
  );
}

/** Contenedor de 2 columnas en escritorio / 1 columna en móvil, para agrupar FormField. */
export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="twoCols">{children}</div>;
}
