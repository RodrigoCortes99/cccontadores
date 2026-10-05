type DateRangeFilterProps = {
  desde: string;
  hasta: string;
  onDesdeChange: (valor: string) => void;
  onHastaChange: (valor: string) => void;
};

export default function DateRangeFilter({ desde, hasta, onDesdeChange, onHastaChange }: DateRangeFilterProps) {
  return (
    <div className="twoCols">
      <div className="loginField">
        <label htmlFor="platform-date-from">Desde</label>
        <input id="platform-date-from" type="date" value={desde} onChange={(e) => onDesdeChange(e.target.value)} />
      </div>
      <div className="loginField">
        <label htmlFor="platform-date-to">Hasta</label>
        <input id="platform-date-to" type="date" value={hasta} onChange={(e) => onHastaChange(e.target.value)} />
      </div>
    </div>
  );
}
