
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GaugeProps {
  value: number;
  label: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 200;
    const height = 120;
    const radius = Math.min(width, height * 2) / 2 - 10;
    const innerRadius = radius - 20;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height - 5})`);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2);

    // Background arc
    g.append("path")
      .datum({ endAngle: Math.PI / 2 })
      .style("fill", "#27272a")
      .attr("d", arc as any);

    // Value arc
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(["#f87171", "#fbbf24", "#4ade80"]);

    const valueAngle = (value / 100) * Math.PI - Math.PI / 2;

    g.append("path")
      .datum({ endAngle: valueAngle })
      .style("fill", colorScale(value))
      .attr("d", arc as any);

    // Label and Score
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-30")
      .attr("class", "text-2xl font-bold fill-white")
      .text(`${Math.round(value)}%`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-10")
      .attr("class", "text-xs uppercase fill-zinc-500 font-bold tracking-widest")
      .text(label);

  }, [value, label]);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg ref={svgRef} width="200" height="120" />
    </div>
  );
};

export default Gauge;
