type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="panelPageHeader">
      <div>
        <h1 className="panelPageHeader__title">{title}</h1>
        {description && <p className="panelPageHeader__desc">{description}</p>}
      </div>
      {actions && <div className="panelPageHeader__actions">{actions}</div>}
    </div>
  );
}
