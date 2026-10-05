export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
};

/**
 * Tabla compacta reutilizable. En pantallas angostas se convierte en tarjetas
 * (cada celda muestra su encabezado como etiqueta) vía CSS, sin duplicar markup.
 */
export default function DataTable<T>({ columns, rows, getRowKey, emptyMessage }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="pageText">{emptyMessage || "Sin resultados."}</p>;
  }

  return (
    <div className="dataTableWrap">
      <table className="dataTable">
        <thead>
          <tr>
            {columns.map((col) => (
              <th scope="col" key={col.key} style={{ textAlign: col.align || "left" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.header} data-align={col.align || "left"} style={{ textAlign: col.align || "left" }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
