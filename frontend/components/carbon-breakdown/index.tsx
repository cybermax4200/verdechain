'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface EmissionsBreakdown {
  stage: string;
  scope: 'scope1' | 'scope2' | 'scope3';
  value: number;
  percentage: number;
}

interface CarbonBreakdownProps {
  breakdown: EmissionsBreakdown[];
  totalFootprint: number;
  scope1: number;
  scope2: number;
  scope3: number;
  confidenceScore?: number;
  methodology?: string;
}

const STAGE_COLORS: Record<string, string> = {
  rawMaterialExtraction: '#f59e0b',
  manufacturing: '#ef4444',
  transportation: '#3b82f6',
  packaging: '#8b5cf6',
  distribution: '#06b6d4',
  retail: '#14b8a6',
  use: '#22c55e',
  endOfLife: '#6b7280',
};

const SCOPE_COLORS = {
  scope1: '#ef4444',
  scope2: '#f59e0b',
  scope3: '#3b82f6',
};

function getEquivalents(kgCO2e: number): { label: string; value: string }[] {
  return [
    { label: 'km driven (car)', value: (kgCO2e / 0.192).toFixed(0) },
    { label: 'smartphones charged', value: (kgCO2e / 0.005).toFixed(0) },
    { label: 'tree seedlings grown', value: (kgCO2e / 18).toFixed(1) },
    { label: 'days of avg household electricity', value: (kgCO2e / 12.7).toFixed(1) },
  ];
}

function DonutChart({ breakdown }: { breakdown: EmissionsBreakdown[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const total = breakdown.reduce((sum, b) => sum + b.value, 0);

  useEffect(() => {
    if (!svgRef.current || total === 0) return;

    const svg = svgRef.current;
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2 - 10;

    const ns = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';

    const center = { x: width / 2, y: height / 2 };
    const donut = document.createElementNS(ns, 'g');
    donut.setAttribute('transform', `translate(${center.x},${center.y})`);
    svg.appendChild(donut);

    let cumulativeAngle = -Math.PI / 2;

    breakdown.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      if (sliceAngle === 0) return;

      const r = radius;
      const x1 = r * Math.cos(cumulativeAngle);
      const y1 = r * Math.sin(cumulativeAngle);
      const x2 = r * Math.cos(cumulativeAngle + sliceAngle);
      const y2 = r * Math.sin(cumulativeAngle + sliceAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const path = document.createElementNS(ns, 'path');
      path.setAttribute(
        'd',
        `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L 0 0 Z`,
      );
      path.setAttribute('fill', STAGE_COLORS[item.stage] ?? '#9ca3af');
      path.setAttribute('opacity', '0.85');
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');

      const title = document.createElementNS(ns, 'title');
      title.textContent = `${item.stage}: ${item.value.toFixed(1)} kg (${item.percentage.toFixed(1)}%)`;
      path.appendChild(title);

      donut.appendChild(path);
      cumulativeAngle += sliceAngle;
    });

    const innerCircle = document.createElementNS(ns, 'circle');
    innerCircle.setAttribute('r', String(radius * 0.6));
    innerCircle.setAttribute('fill', '#fff');
    innerCircle.setAttribute('opacity', '0.95');
    donut.appendChild(innerCircle);

    const totalText = document.createElementNS(ns, 'text');
    totalText.setAttribute('text-anchor', 'middle');
    totalText.setAttribute('dy', '-0.2em');
    totalText.setAttribute('font-size', '16');
    totalText.setAttribute('font-weight', 'bold');
    totalText.setAttribute('fill', '#111827');
    totalText.textContent = `${(total / 1000).toFixed(1)}t`;
    donut.appendChild(totalText);

    const unitText = document.createElementNS(ns, 'text');
    unitText.setAttribute('text-anchor', 'middle');
    unitText.setAttribute('dy', '1.2em');
    unitText.setAttribute('font-size', '10');
    unitText.setAttribute('fill', '#6b7280');
    unitText.textContent = 'kg CO₂e';
    donut.appendChild(unitText);
  }, [breakdown, total]);

  if (total === 0) return null;

  return <svg ref={svgRef} className="w-full max-w-[200px] mx-auto" />;
}

export function CarbonBreakdown({
  breakdown,
  totalFootprint,
  scope1,
  scope2,
  scope3,
  confidenceScore,
  methodology,
}: CarbonBreakdownProps) {
  const equivalents = getEquivalents(totalFootprint);
  const totalScope = scope1 + scope2 + scope3;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Carbon Footprint</p>
        <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">
          {totalFootprint.toFixed(1)}
          <span className="text-lg font-normal text-gray-500 ml-2">kg CO₂e</span>
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {confidenceScore !== undefined && (
            <span>
              Confidence: {confidenceScore}%
              {confidenceScore >= 80 ? ' ✅' : confidenceScore >= 50 ? ' ⚠️' : ' ❌'}
            </span>
          )}
          {methodology && <span>Methodology: {methodology}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Emissions by Lifecycle Stage
          </h4>
          <DonutChart breakdown={breakdown} />
          <div className="mt-3 space-y-1.5">
            {breakdown.map((item) => (
              <div key={item.stage} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: STAGE_COLORS[item.stage] ?? '#9ca3af' }}
                />
                <span className="flex-1 capitalize text-gray-600 dark:text-gray-400">
                  {item.stage.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.value.toFixed(1)} kg
                </span>
                <span className="text-gray-400">({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Scope Breakdown
          </h4>
          <div className="space-y-3">
            {([
              { key: 'scope1', label: 'Scope 1 — Direct Emissions', value: scope1 },
              { key: 'scope2', label: 'Scope 2 — Energy Indirect', value: scope2 },
              { key: 'scope3', label: 'Scope 3 — Supply Chain', value: scope3 },
            ] as const).map(({ key, label, value }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {value.toFixed(1)} kg
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${totalScope > 0 ? (value / totalScope) * 100 : 0}%`,
                      backgroundColor: SCOPE_COLORS[key],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
            {(['scope1', 'scope2', 'scope3'] as const).map((key) => (
              <div key={key} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: SCOPE_COLORS[key] }}
                />
                {key.replace('scope', 'S')}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Carbon Equivalents
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {equivalents.map((eq) => (
            <div key={eq.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{eq.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{eq.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
