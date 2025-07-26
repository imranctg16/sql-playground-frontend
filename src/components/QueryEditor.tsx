import React, { useState } from 'react';
import { QueryResult } from '../types';

interface QueryEditorProps {
  onQuerySubmit: (query: string, queryType: 'sql' | 'laravel') => void;
  loading: boolean;
  result: QueryResult | null;
}

const QueryEditor: React.FC<QueryEditorProps> = ({
  onQuerySubmit,
  loading,
  result,
}) => {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<'sql' | 'laravel'>('sql');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuerySubmit(query, queryType);
    }
  };

  const renderTable = (data: any[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="p-4 text-gray-500 text-center">
          No data to display
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div>
        <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-2 border-b text-sm text-gray-900"
                    >
                      {String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Query Editor</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="mb-4">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="sql"
                checked={queryType === 'sql'}
                onChange={(e) => setQueryType(e.target.value as 'sql')}
                className="mr-2"
              />
              SQL Query
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="laravel"
                checked={queryType === 'laravel'}
                onChange={(e) => setQueryType(e.target.value as 'laravel')}
                className="mr-2"
              />
              Laravel Query Builder
            </label>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              queryType === 'sql'
                ? 'SELECT * FROM products WHERE price > 100;'
                : 'Product::where("price", ">", 100)->get();'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-y"
            rows={6}
            disabled={loading}
          />
        </div>

        {/* Error Card Above Run Query Button */}
        {result && !result.is_correct && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-red-600 text-lg">❌</span>
              <div className="flex-1">
                <h4 className="font-medium text-red-800 text-sm mb-1">Query Error</h4>
                <p className="text-red-700 text-sm mb-2">{result.message}</p>
                
                {result.error_details && (
                  <div className="text-xs">
                    {result.error_details.query && (
                      <div className="mb-2">
                        <span className="font-medium text-red-800">Your Query:</span>
                        <code className="block mt-1 p-2 bg-red-100 text-red-800 rounded font-mono break-all">
                          {result.error_details.query}
                        </code>
                      </div>
                    )}
                    <div className="text-red-600">
                      💡 <strong>Tip:</strong> Check your SQL syntax. For JOINs, use: FROM table1 JOIN table2 ON condition
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running...' : 'Run Query'}
        </button>
      </form>

      {result && result.is_correct && (
        <div className="border-t">
          <div className="p-4">
            <div className="p-4 rounded-lg mb-4 bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-green-600">✅</span>
                <span className="font-medium text-green-800">Correct!</span>
                <span className="text-green-600 font-medium">
                  +{result.points_earned} points
                </span>
              </div>
              <p className="text-sm text-green-700">{result.message}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                {renderTable(result.user_result, 'Your Result')}
              </div>
              <div>
                {renderTable(result.expected_result, 'Expected Result')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryEditor;