'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface LifecycleEvent {
  id?: string;
  stage: string;
  description?: string;
  location?: string;
  timestamp: string;
  energyKwh?: number;
  fuelUsed?: number;
  fuelType?: string;
  wasteKg?: number;
  emissionsKg?: number;
  materialInputs?: { name: string; amount: number; unit: string }[];
  participants?: { name: string; role: string }[];
}

interface LifecycleTimelineProps {
  events: LifecycleEvent[];
}

const STAGE_ICONS: Record<string, string> = {
  raw_material_extraction: '⛏️',
  raw_material_processing: '🏗️',
  manufacturing: '🏭',
  assembly: '🔧',
  packaging: '📦',
  transportation: '🚚',
  distribution: '📤',
  retail: '🏪',
  use: '🔌',
  end_of_life: '♻️',
  recycling: '🔄',
};

const STAGE_COLORS: Record<string, string> = {
  raw_material_extraction: '#f59e0b',
  raw_material_processing: '#f97316',
  manufacturing: '#ef4444',
  assembly: '#ec4899',
  packaging: '#8b5cf6',
  transportation: '#3b82f6',
  distribution: '#06b6d4',
  retail: '#14b8a6',
  use: '#22c55e',
  end_of_life: '#6b7280',
  recycling: '#10b981',
};

export function LifecycleTimeline({ events }: LifecycleTimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const maxEmissions = Math.max(...sortedEvents.map((e) => e.emissionsKg ?? 0), 1);

  if (sortedEvents.length === 0) {
    return (
      <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
        <p className="mb-2 text-lg">📋</p>
        <p>No lifecycle events recorded yet.</p>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[23px] top-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-6">
        {sortedEvents.map((event, index) => {
          const eventId = event.id ?? `event-${index}`;
          const isExpanded = expandedEvent === eventId;
          const stageKey = event.stage?.toLowerCase().replace(/ /g, '_');
          const icon = STAGE_ICONS[stageKey] ?? '📌';
          const color = STAGE_COLORS[stageKey] ?? '#6b7280';
          const emissionsBarWidth = event.emissionsKg
            ? (event.emissionsKg / maxEmissions) * 100
            : 0;

          return (
            <div key={eventId} className="relative pl-14">
              <div
                className="absolute left-4 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm shadow-sm dark:border-gray-950"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
              <Card
                className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                onClick={() => setExpandedEvent(isExpanded ? null : eventId)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-medium capitalize text-gray-900 dark:text-gray-100">
                        {event.stage?.replace(/_/g, ' ').toLowerCase()}
                      </h4>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    {event.description && (
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {event.emissionsKg !== undefined && (
                      <p className="text-brand-600 dark:text-brand-400 mt-1 text-sm font-semibold">
                        {event.emissionsKg.toFixed(1)} kg CO₂e
                      </p>
                    )}
                  </div>
                </div>

                {event.emissionsKg !== undefined && (
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${emissionsBarWidth}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )}

                {event.location && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    📍 {event.location}
                  </p>
                )}

                {isExpanded && (
                  <div className="animate-slide-up mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                    {(event.energyKwh || event.fuelUsed || event.wasteKg) && (
                      <div className="grid grid-cols-3 gap-3">
                        {event.energyKwh !== undefined && (
                          <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {event.energyKwh.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">kWh</p>
                          </div>
                        )}
                        {event.fuelUsed !== undefined && (
                          <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {event.fuelUsed.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {event.fuelType ? `${event.fuelType} (L)` : 'L'}
                            </p>
                          </div>
                        )}
                        {event.wasteKg !== undefined && (
                          <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {event.wasteKg.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500">Waste (kg)</p>
                          </div>
                        )}
                      </div>
                    )}

                    {event.materialInputs && event.materialInputs.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Material Inputs
                        </p>
                        <div className="space-y-1">
                          {event.materialInputs.map((input, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                            >
                              <span>{input.name}</span>
                              <span className="font-medium">
                                {input.amount} {input.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.participants && event.participants.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Participants
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.participants.map((p, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {p.name} ({p.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  {isExpanded ? '▲ Click to collapse' : '▼ Click to expand details'}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
