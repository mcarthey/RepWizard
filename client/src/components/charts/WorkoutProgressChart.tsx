import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface ChartData {
  date: string;
  [key: string]: any;
}

interface WorkoutProgressChartProps {
  data: ChartData[];
  dataKey: string;
  color: string;
}

export default function WorkoutProgressChart({
  data,
  dataKey,
  color
}: WorkoutProgressChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Responsive chart container measurement
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    }
  }, []);

  // Format date for tooltip
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy");
  };
  
  // Calculate personal best for reference line
  const personalBest = Math.max(...data.map(item => item[dataKey]));
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
          <p className="font-semibold">{formatDate(label)}</p>
          <p className="text-primary-600">
            {`${dataKey === 'maxWeight' ? 'Max Weight' : 
               dataKey === 'estimatedOneRM' ? 'Est. 1RM' : 
               'Volume'}: ${payload[0].value} lbs`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Dynamically determine how many ticks to show based on width
  const getTickCount = () => {
    if (containerWidth < 300) return 2;
    if (containerWidth < 500) return 3;
    return 5;
  };

  return (
    <div ref={containerRef} className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => format(parseISO(value), "M/d")}
            tick={{ fontSize: 12 }}
            tickCount={getTickCount()}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickCount={5}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={personalBest} 
            stroke="#10b981" 
            strokeDasharray="3 3" 
            label={{ 
              value: "PB", 
              position: "right", 
              fill: "#10b981", 
              fontSize: 12 
            }} 
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
