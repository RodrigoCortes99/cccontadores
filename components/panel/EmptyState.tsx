type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="emptyState">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="emptyState__action">{action}</div>}
    </div>
  );
}
