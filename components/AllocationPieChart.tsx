import React, { useMemo, useState } from 'react';

interface PieChartData {
  ticker: string;
  value: number;
}

const COLORS = [
  '#10B981', '#059669', '#34D399', '#6EE7B7', 
  '#047857', '#A7F3D0', '#065F46', '#064E3B'
];

const getCoordinatesForPercent = (percent: number, radius: number) => {
  const x = radius * Math.cos(2 * Math.PI * percent);
  const y = radius * Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const AllocationPieChart: React.FC<{ data: PieChartData[] }> = ({ data }) => {
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);

  const totalValue = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);
  
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => b.value - a.value), 
  [data]);

  let cumulativePercent = 0;
  const slices = sortedData.map((item, index) => {
    const percent = item.value / totalValue;
    const [startX, startY] = getCoordinatesForPercent(cumulativePercent, 50);
    cumulativePercent += percent;
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent, 50);
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    
    const pathData = [
      `M ${startX} ${startY}`,
      `A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`,
    ].join(' ');

    return {
      pathData,
      color: COLORS[index % COLORS.length],
      ticker: item.ticker,
      percentage: percent * 100,
      value: item.value,
    };
  });

  const hoveredSlice = hoveredTicker ? slices.find(s => s.ticker === hoveredTicker) : null;

  if (data.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 text-content-200 bg-base-300/50 rounded-lg">
            <p>Sem dados de alocação.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
            <svg viewBox="-60 -60 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {slices.map((slice, index) => (
                <path
                    key={index}
                    d={slice.pathData}
                    fill={slice.color}
                    onMouseEnter={() => setHoveredTicker(slice.ticker)}
                    onMouseLeave={() => setHoveredTicker(null)}
                    className="transition-transform duration-200 ease-in-out cursor-pointer"
                    style={{ transform: hoveredTicker === slice.ticker ? 'scale(1.05)' : 'scale(1)' }}
                />
                ))}
                <circle cx="0" cy="0" r="25" fill="#374151" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                {hoveredSlice ? (
                    <>
                        <p className="font-bold text-lg text-content-100">{hoveredSlice.ticker}</p>
                        <p className="text-sm font-semibold" style={{ color: hoveredSlice.color }}>
                            {hoveredSlice.percentage.toFixed(2)}%
                        </p>
                    </>
                ) : (
                    <p className="text-md font-semibold text-content-200">Alocação</p>
                )}
                </div>
            </div>
        </div>
        <div className="w-full">
            <ul className="space-y-2 text-sm">
                {slices.slice(0, 6).map((slice, index) => (
                    <li 
                        key={index} 
                        className="flex items-center justify-between"
                        onMouseEnter={() => setHoveredTicker(slice.ticker)}
                        onMouseLeave={() => setHoveredTicker(null)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></span>
                            <span className="font-semibold text-content-100">{slice.ticker}</span>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-content-100">{slice.percentage.toFixed(2)}%</p>
                           <p className="text-xs text-content-200">{slice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </li>
                ))}
                 {slices.length > 6 && (
                    <li className="text-center text-content-200 text-xs pt-2">
                        e outros {slices.length - 6} ativos...
                    </li>
                )}
            </ul>
        </div>
    </div>
  );
};

export default AllocationPieChart;
