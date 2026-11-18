"use client";

import { useMemo } from "react";

interface SparklineProps {
  dataPoints: Array<{ year?: string; date?: string; value: any }>;
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({
  dataPoints,
  width = 110,
  height = 32,
  color = "#3B82F6",
}: SparklineProps) {
  const points = useMemo(() => {
    if (!Array.isArray(dataPoints) || dataPoints.length === 0) return [];

    const extracted = dataPoints.map((dp) => {
      let val = 0;
      const rawVal = dp.value;
      if (typeof rawVal === "number") {
        val = rawVal;
      } else if (Array.isArray(rawVal)) {
        const totalObj = rawVal.find((item: any) => item && typeof item === "object" && "total" in item) || rawVal[0];
        val = totalObj ? (Object.values(totalObj)[0] as number) : 0;
      }
      return val;
    });

    const min = Math.min(...extracted);
    const max = Math.max(...extracted);
    const range = max - min || 1;
    const padding = 4;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    return extracted.map((v, idx) => {
      const x = padding + (idx / (extracted.length - 1 || 1)) * drawW;
      const y = height - padding - ((v - min) / range) * drawH;
      return { x, y };
    });
  }, [dataPoints, width, height]);

  if (points.length < 2) return null;

  const pathD = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
      />
    </svg>
  );
}
