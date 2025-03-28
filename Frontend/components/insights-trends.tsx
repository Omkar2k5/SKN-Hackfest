"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Jan",
    dining: 400,
    shopping: 240,
    entertainment: 180,
    transportation: 220,
  },
  {
    name: "Feb",
    dining: 380,
    shopping: 290,
    entertainment: 190,
    transportation: 210,
  },
  {
    name: "Mar",
    dining: 450,
    shopping: 310,
    entertainment: 220,
    transportation: 240,
  },
  {
    name: "Apr",
    dining: 420,
    shopping: 380,
    entertainment: 250,
    transportation: 230,
  },
  {
    name: "May",
    dining: 500,
    shopping: 400,
    entertainment: 280,
    transportation: 250,
  },
  {
    name: "Jun",
    dining: 480,
    shopping: 350,
    entertainment: 260,
    transportation: 220,
  },
]

export function InsightsTrends() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" stroke="#666" />
          <YAxis stroke="#666" />
          <Legend />
          <Bar dataKey="dining" name="Dining" fill="#3b82f6" />
          <Bar dataKey="shopping" name="Shopping" fill="#10b981" />
          <Bar dataKey="entertainment" name="Entertainment" fill="#8b5cf6" />
          <Bar dataKey="transportation" name="Transportation" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

