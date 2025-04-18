"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MerchantExpense } from '@/types/finance';
import { memo } from 'react';

interface ExpensePieChartProps {
  data: MerchantExpense[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c43',
];

const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg shadow-md border">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm">₹{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-gray-500">No expense data available</p>
      </div>
    );
  }

  // Limit data to top 8 entries to match COLORS array
  const limitedData = data.slice(0, 8);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={limitedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
            nameKey="merchant"
            isAnimationActive={false}  // Disable animations for better performance
          >
            {limitedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(ExpensePieChart);

