import React, { useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge, Position, ConnectionLineType } from 'reactflow';
import { TableSchema } from '../types';

interface DatabaseDiagramProps {
  schema: TableSchema;
}

const getNodeStyle = (tableName: string) => {
  const baseStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '0',
    width: 280,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease',
  };

  const colorMap: Record<string, string> = {
    categories: '#3b82f6',
    products: '#10b981',
    orders: '#f59e0b',
    order_items: '#8b5cf6',
    questions: '#6b7280',
  };

  const gradientMap: Record<string, string> = {
    categories: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    products: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    orders: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    order_items: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    questions: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  };

  return { 
    ...baseStyle, 
    borderTop: `4px solid ${colorMap[tableName] || '#6b7280'}`,
    borderImage: gradientMap[tableName] || 'none',
  };
};

const getTypeColor = (type: string) => {
  if (type.includes('int')) return '#3b82f6';
  if (type.includes('varchar') || type.includes('text')) return '#10b981';
  if (type.includes('decimal')) return '#8b5cf6';
  if (type.includes('timestamp') || type.includes('date')) return '#f59e0b';
  if (type.includes('enum')) return '#ec4899';
  if (type.includes('boolean')) return '#6366f1';
  return '#6b7280';
};

const getTableIcon = (tableName: string) => {
  const iconMap: Record<string, string> = {
    categories: '📂',
    products: '📦',
    orders: '🛒',
    order_items: '📋',
    questions: '❓',
  };
  return iconMap[tableName] || '🗂️';
};

const DatabaseDiagram: React.FC<DatabaseDiagramProps> = ({ schema }) => {
  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const tablePositions: { [key: string]: { x: number; y: number } } = {
      categories: { x: 50, y: 50 },
      products: { x: 400, y: 50 },
      orders: { x: 50, y: 400 },
      order_items: { x: 400, y: 400 },
      questions: { x: 750, y: 225 },
    };

    const getTableHeaderColor = (tableName: string) => {
      const colorMap: Record<string, string> = {
        categories: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        products: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        orders: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        order_items: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        questions: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      };
      return colorMap[tableName] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    };

    Object.keys(schema).forEach((tableName) => {
      initialNodes.push({
        id: tableName,
        type: 'default',
        data: {
          label: (
            <div style={{ 
              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
              borderRadius: '11px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ 
                padding: '14px 18px', 
                background: getTableHeaderColor(tableName),
                color: 'white',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '16px' }}>{getTableIcon(tableName)}</span>
                <strong style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}>{tableName}</strong>
              </div>
              <ul style={{ 
                padding: '12px 18px', 
                margin: 0, 
                listStyle: 'none',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {schema[tableName].map((col, index) => (
                  <li key={col.Field} style={{ 
                    fontSize: '13px', 
                    padding: '6px 0', 
                    borderTop: index === 0 ? 'none' : '1px solid #f1f5f9',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.borderRadius = '6px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderRadius = '0';
                  }}
                  >
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      fontWeight: col.Key === 'PRI' ? '600' : '500',
                      color: col.Key === 'PRI' ? '#1f2937' : '#374151',
                    }}>
                      {col.Key === 'PRI' && <span title="Primary Key" style={{ fontSize: '14px', marginRight: 6 }}>🔑</span>}
                      {col.Key === 'MUL' && <span title="Foreign Key/Index" style={{ fontSize: '14px', marginRight: 6 }}>🔗</span>}
                      {col.Field}
                    </span>
                    <span style={{ 
                      color: getTypeColor(col.Type), 
                      fontSize: '11px',
                      fontWeight: '500',
                      background: `${getTypeColor(col.Type)}15`,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${getTypeColor(col.Type)}30`,
                    }}>{col.Type}</span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        },
        position: tablePositions[tableName] || { x: 0, y: 0 },
        style: getNodeStyle(tableName),
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    const relationships = [
      { source: 'categories', target: 'products', label: '1:N', color: '#2563eb' },
      { source: 'products', target: 'order_items', label: '1:N', color: '#059669' },
      { source: 'orders', target: 'order_items', label: '1:N', color: '#d97706' },
    ];

    relationships.forEach((rel, i) => {
      initialEdges.push({
        id: `e-${rel.source}-${rel.target}`,
        source: rel.source,
        target: rel.target,
        type: 'smoothstep',
        label: rel.label,
        markerEnd: { 
          type: 'arrowclosed', 
          color: rel.color,
          width: 25,
          height: 25,
        },
        style: { 
          stroke: rel.color, 
          strokeWidth: 4,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))',
        },
        labelStyle: { 
          fill: '#ffffff', 
          fontSize: 12,
          fontWeight: '700',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
        },
        labelBgStyle: { 
          fill: rel.color, 
          fillOpacity: 0.9,
          stroke: '#ffffff',
          strokeWidth: 2,
          strokeOpacity: 1,
        },
        labelBgPadding: [8, 12],
        labelBgBorderRadius: 12,
        animated: true,
      });
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [schema]);

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
    }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodeTypes={{}}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
        connectionLineType={ConnectionLineType.SmoothStep}
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <MiniMap 
          nodeColor={(node) => {
            const colorMap: Record<string, string> = {
              categories: '#3b82f6',
              products: '#10b981',
              orders: '#f59e0b',
              order_items: '#8b5cf6',
              questions: '#6b7280',
            };
            return colorMap[node.id!] || '#6b7280';
          }}
          nodeStrokeWidth={2}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        <Controls 
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        <Background 
          color="#e2e8f0" 
          gap={24}
          size={0.8}
          style={{
            opacity: 0.3,
          }}
        />
      </ReactFlow>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        fontSize: '12px',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
        minWidth: '180px',
      }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          color: '#1f2937',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>🗂️</span>
          Database Schema
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.keys(schema).map((tableName) => (
            <div key={tableName} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '4px 0',
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: (() => {
                  const colorMap: Record<string, string> = {
                    categories: '#3b82f6',
                    products: '#10b981',
                    orders: '#f59e0b',
                    order_items: '#8b5cf6',
                    questions: '#6b7280',
                  };
                  return colorMap[tableName] || '#6b7280';
                })(),
              }}></div>
              <span style={{ 
                color: '#374151',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {getTableIcon(tableName)} {tableName}
              </span>
            </div>
          ))}
        </div>
        <div style={{ 
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '11px',
          color: '#6b7280',
        }}>
          <div style={{ marginBottom: '4px' }}>🔑 Primary Key</div>
          <div style={{ marginBottom: '4px' }}>🔗 Foreign Key/Index</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: '4px' 
          }}>
            <div style={{
              width: '16px',
              height: '3px',
              background: '#2563eb',
              borderRadius: '2px'
            }}></div>
            <span>1:N Relationship</span>
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
            Thicker lines = clearer relationships
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDiagram;