import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: (row: T) => string | number;
  empty?: string;
}

export function Table<T>({
  columns,
  data,
  keyField,
  empty = 'No data available',
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-4 py-3 text-left font-semibold text-slate-600 ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-400"
              >
                {empty}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyField(row)} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`px-4 py-3 text-slate-700 ${col.className ?? ''}`}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
