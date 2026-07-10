type SearchAndFiltersProps = {
  search: string;
  onSearchChange: (valor: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

export default function SearchAndFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  actions,
}: SearchAndFiltersProps) {
  return (
    <div className="filterBar">
      <div className="filterBar__row">
        <input
          type="search"
          className="filterBar__search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {actions && <div className="filterBar__actions">{actions}</div>}
      </div>
      {filters && <div className="filterBar__filters">{filters}</div>}
    </div>
  );
}
