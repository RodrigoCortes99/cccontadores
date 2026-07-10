export default function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="loadingState" role="status" aria-live="polite">
      <span className="loadingState__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
