'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';

interface GraphNode {
  id: string;
  label: string;
  role: 'manufacturer' | 'supplier' | 'logistics' | 'verifier' | 'retailer';
  productCount?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  type: 'transfer' | 'lifecycle' | 'certification';
  timestamp?: string;
}

interface ProvenanceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
}

const ROLE_COLORS: Record<string, string> = {
  manufacturer: '#22c55e',
  supplier: '#3b82f6',
  logistics: '#f59e0b',
  verifier: '#8b5cf6',
  retailer: '#ef4444',
};

const ROLE_ICONS: Record<string, string> = {
  manufacturer: '🏭',
  supplier: '📦',
  logistics: '🚚',
  verifier: '✅',
  retailer: '🏪',
};

export function ProvenanceGraph({ nodes, edges, onNodeClick }: ProvenanceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(400, containerRef.current.clientHeight),
        });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const simNodes = nodes.map((n) => ({ ...n }));
    const simLinks = edges.map((e) => ({ ...e }));

    const simulation = d3
      .forceSimulation(simNodes as any)
      .force(
        'link',
        d3
          .forceLink(simLinks as any)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    const defs = svg.append('defs');

    edges.forEach((_, i) => {
      defs
        .append('marker')
        .attr('id', `arrow-${i}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#9ca3af');
    });

    const linkGroup = svg.append('g').selectAll('g').data(simLinks).join('g');

    linkGroup
      .append('line')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d: any) => (d.type === 'certification' ? '5,5' : 'none'))
      .attr('marker-end', (_d: any, i: number) => `url(#arrow-${i})`);

    linkGroup
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .attr('dy', '-8')
      .text((d: any) => d.label ?? '');

    const nodeGroup = svg
      .append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: any) => {
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .call(
        d3
          .drag<any, any>()
          .on('start', (event: any, d: any) => {
            if (!event.active) {
              simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) {
              simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
          }),
      );

    nodeGroup
      .append('circle')
      .attr('r', 24)
      .attr('fill', (d: any) => ROLE_COLORS[d.role] ?? '#9ca3af')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9);

    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '16px')
      .text((d: any) => ROLE_ICONS[d.role] ?? '📄');

    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '38')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .attr('font-weight', '500')
      .text((d: any) => (d.label.length > 15 ? `${d.label.slice(0, 15)}…` : d.label));

    simulation.on('tick', () => {
      linkGroup
        .selectAll('line')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkGroup
        .selectAll('text')
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions, onNodeClick]);

  if (nodes.length === 0) {
    return (
      <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
        <p className="mb-2 text-lg">🔗</p>
        <p>No provenance data available for this product.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        style={{ minHeight: 400 }}
      >
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full" />
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(ROLE_ICONS).map(([role, icon]) => (
          <div key={role} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[role] }} />
            <span>
              {icon} {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </div>
        ))}
        <div className="ml-4 flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-gray-300" />
          <span>Transfer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-gray-300" />
          <span>Certification</span>
        </div>
      </div>
      {selectedNode && (
        <Card className="animate-slide-up p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {ROLE_ICONS[selectedNode.role]} {selectedNode.label}
              </p>
              <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
                Role: {selectedNode.role}
              </p>
              {selectedNode.productCount !== undefined && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Products: {selectedNode.productCount}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
