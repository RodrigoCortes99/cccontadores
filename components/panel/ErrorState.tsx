type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="errorState" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="cc-btn cc-btn--outline" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
