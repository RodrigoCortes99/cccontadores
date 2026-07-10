type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export default function FormField({ label, htmlFor, hint, error, required, children }: FormFieldProps) {
  return (
    <div className="loginField">
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="formField__required"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="formField__hint">{hint}</span>}
      {error && <span className="loginError">{error}</span>}
    </div>
  );
}

/** Contenedor de 2 columnas en escritorio / 1 columna en móvil, para agrupar FormField. */
export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="twoCols">{children}</div>;
}
