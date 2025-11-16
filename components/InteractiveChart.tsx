import React, { useState, useMemo, useRef } from 'react';
import { HistoricalDataPoint } from '../types';

interface TooltipData {
    x: number;
    y: number;
    date: string;
    value: number;
    investedValue: number | null;
}

interface InteractiveChartProps {
  data: HistoricalDataPoint[];
  investedData?: HistoricalDataPoint[];
  color: string;
  height?: number;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({ data, investedData, color, height = 200 }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const { path, areaPath, width, points, investedPath, tooltipPoints } = useMemo(() => {
        if (!data || data.length < 2) return { path: '', areaPath: '', width: 0, points: [], investedPath: '', tooltipPoints: [] };
        
        const w = 500;
        const h = height;
        const padding = 5;

        const allValues = [...data.map(d => d.value), ...(investedData?.map(d => d.value) ?? [])];
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        
        const valRange = (maxVal - minVal) || 1;

        const getX = (date: number) => (w / (data.length - 1)) * date;
        const getY = (value: number) => (h - padding) - (valRange > 0 ? ((value - minVal) / valRange) * (h - padding * 2) : h / 2);
        
        const mappedPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
        const investedPoints = investedData?.map((d, i) => ({ x: getX(i), y: getY(d.value)})) ?? [];

        const tPoints: TooltipData[] = data.map((d, i) => ({
            x: getX(i),
            y: getY(d.value),
            date: d.date,
            value: d.value,
            investedValue: investedData?.[i]?.value ?? null,
        }));
        
        let pathStr = `M ${mappedPoints[0].x} ${mappedPoints[0].y}`;
        mappedPoints.slice(1).forEach(p => { pathStr += ` L ${p.x} ${p.y}`; });
        
        let areaPathStr = pathStr + ` L ${mappedPoints[mappedPoints.length - 1].x} ${h - padding} L ${mappedPoints[0].x} ${h - padding} Z`;
        
        let investedPathStr = investedPoints.length > 0 ? `M ${investedPoints[0].x} ${investedPoints[0].y}` : '';
        investedPoints.slice(1).forEach(p => { investedPathStr += ` L ${p.x} ${p.y}`; });

        return { path: pathStr, areaPath: areaPathStr, width: w, points: mappedPoints, investedPath: investedPathStr, tooltipPoints: tPoints };
    }, [data, investedData, height]);

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || tooltipPoints.length === 0) return;
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * width;

        const closestPoint = tooltipPoints.reduce((closest, point) => {
            const dist = Math.abs(point.x - mouseX);
            const closestDist = Math.abs(closest.x - mouseX);
            return dist < closestDist ? point : closest;
        }, tooltipPoints[0]);

        setTooltip(closestPoint);
    };

    if (!data || data.length < 2) {
        return <div style={{height: `${height}px`}} className="flex items-center justify-center text-content-200 bg-base-300/50 rounded-lg"><p>Dados insuficientes para exibir o gráfico.</p></div>;
    }
    
    const profitLoss = tooltip && tooltip.investedValue !== null ? tooltip.value - tooltip.investedValue : null;
    const isProfit = profitLoss !== null && profitLoss >= 0;

    return (
        <div className="relative">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
                className="w-full h-auto"
            >
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#gradient-${color})`} />
                {investedPath && (
                    <path d={investedPath} fill="none" strokeWidth="1.5" strokeDasharray="4 4" className="stroke-content-200/70" />
                )}
                <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
                {tooltip && (
                    <>
                        <line x1={tooltip.x} y1={0} x2={tooltip.x} y2={height} strokeWidth="1" className="stroke-content-200/50" />
                        <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} stroke="#374151" strokeWidth="2" />
                    </>
                )}
            </svg>
            {tooltip && (
                <div className="absolute bg-base-100/80 backdrop-blur-sm text-content-100 p-2 rounded-md shadow-lg text-xs pointer-events-none border border-base-300" style={{
                    left: `${(tooltip.x / width) * 100}%`,
                    top: `10px`,
                    transform: `translateX(-50%)`,
                    minWidth: '150px'
                }}>
                    <div className="font-semibold text-center mb-1">{new Date(tooltip.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                    <div className="grid grid-cols-2 gap-x-2 text-right">
                        <span className="text-content-200">Patrimônio:</span>
                        <span className="font-bold">{tooltip.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        
                        {tooltip.investedValue !== null && (
                            <>
                                <span className="text-content-200">Investido:</span>
                                <span className="font-bold">{tooltip.investedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </>
                        )}
                        {profitLoss !== null && (
                            <>
                                <span className="text-content-200">L/P na Data:</span>
                                <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>{profitLoss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractiveChart;