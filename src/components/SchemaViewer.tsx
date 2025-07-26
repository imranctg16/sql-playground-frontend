import React, { useState } from 'react';
import { TableSchema } from '../types';
import DatabaseDiagram from './DatabaseDiagram.tsx';

interface SchemaViewerProps {
  schema: TableSchema | null;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diagram' | 'tables'>('diagram');

  if (!schema) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Database Schema</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading schema...</span>
        </div>
      </div>
    );
  }

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getColumnIcon = (column: any) => {
    if (column.Key === 'PRI') return '🔑';
    if (column.Key === 'MUL') return '🔗';
    if (column.Field.includes('id')) return '🆔';
    if (column.Type.includes('varchar') || column.Type.includes('text')) return '📝';
    if (column.Type.includes('int') || column.Type.includes('decimal')) return '🔢';
    if (column.Type.includes('date') || column.Type.includes('time')) return '📅';
    if (column.Type.includes('boolean')) return '☑️';
    return '📄';
  };

  const getColumnTypeColor = (type: string) => {
    if (type.includes('varchar') || type.includes('text')) return 'bg-green-100 text-green-800';
    if (type.includes('int') || type.includes('decimal')) return 'bg-blue-100 text-blue-800';
    if (type.includes('date') || type.includes('time')) return 'bg-purple-100 text-purple-800';
    if (type.includes('boolean')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getKeyBadge = (column: any) => {
    if (column.Key === 'PRI') {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">PRIMARY</span>;
    }
    if (column.Key === 'MUL') {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">INDEX</span>;
    }
    return null;
  };

  const relationships = {
    'products': ['category_id → categories.id'],
    'order_items': ['order_id → orders.id', 'product_id → products.id'],
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              🗄️ Interactive Database Schema
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Explore database structure with interactive diagram or detailed tables
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'diagram'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📊 Diagram View
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tables'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              🗃️ Table Details
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'diagram' ? (
        <div style={{ height: '700px' }}>
          <DatabaseDiagram schema={schema} />
        </div>
      ) : (
        <div className="p-6">
          {/* Schema Overview */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Schema Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(schema).length}</div>
                <div className="text-blue-700">Tables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(schema).reduce((sum, cols) => sum + cols.length, 0)}
                </div>
                <div className="text-green-700">Columns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(schema).reduce((sum, cols) => sum + cols.filter(c => c.Key === 'PRI').length, 0)}
                </div>
                <div className="text-purple-700">Primary Keys</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(schema).reduce((sum, cols) => sum + cols.filter(c => c.Key === 'MUL').length, 0)}
                </div>
                <div className="text-orange-700">Indexes</div>
              </div>
            </div>
          </div>

        {/* Interactive Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(schema).map(([tableName, columns]) => (
            <div 
              key={tableName} 
              className={`border-2 rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer ${
                selectedTable === tableName 
                  ? 'border-blue-500 shadow-lg bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedTable(selectedTable === tableName ? null : tableName)}
            >
              {/* Table Header */}
              <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🗃️</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{tableName}</h3>
                      <p className="text-sm text-gray-600">{columns.length} columns</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTable(tableName);
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transition-transform ${expandedTables.has(tableName) ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Table Content */}
              <div className="p-4">
                {/* Relationships */}
                {relationships[tableName as keyof typeof relationships] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-800 text-sm mb-2">🔗 Relationships</h4>
                    <div className="space-y-1">
                      {relationships[tableName as keyof typeof relationships].map((rel, idx) => (
                        <div key={idx} className="text-sm text-amber-700 font-mono">{rel}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Columns Preview */}
                <div className="space-y-2">
                  {columns.slice(0, expandedTables.has(tableName) ? columns.length : 3).map((column) => (
                    <div 
                      key={column.Field} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getColumnIcon(column)}</span>
                        <div>
                          <span className="font-semibold text-gray-800">{column.Field}</span>
                          {getKeyBadge(column)}
                          {column.Null === 'NO' && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                              NOT NULL
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getColumnTypeColor(column.Type)}`}>
                          {column.Type}
                        </span>
                        {column.Default && (
                          <div className="text-xs text-gray-500 mt-1">
                            Default: {column.Default}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!expandedTables.has(tableName) && columns.length > 3 && (
                    <div className="text-center py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTable(tableName);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Show {columns.length - 3} more columns...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">🏷️ Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span>🔑</span>
                <span>Primary Key</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔗</span>
                <span>Foreign Key</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📝</span>
                <span>Text Field</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔢</span>
                <span>Number</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📅</span>
                <span>Date/Time</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🆔</span>
                <span>ID Field</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table info panel for both views */}
      {selectedTable && activeTab === 'tables' && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">
              Table: {selectedTable}
            </h3>
            <button
              onClick={() => setSelectedTable(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{schema[selectedTable].length}</span> columns •{' '}
            <span className="font-medium">
              {schema[selectedTable].filter(c => c.Key === 'PRI').length}
            </span> primary key(s) •{' '}
            <span className="font-medium">
              {schema[selectedTable].filter(c => c.Key === 'MUL').length}
            </span> indexed column(s)
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaViewer;