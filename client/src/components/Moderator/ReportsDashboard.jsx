import React from 'react';
import { FaChartPie, FaFileExport } from 'react-icons/fa';

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

import { Line, Pie } from 'react-chartjs-2';

// Register Chart.js components once (fixes common registry errors)
ChartJS.register(
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Data for trend line chart
const monthlyTrendsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Verified Items',
      data: [40, 50, 60, 62, 70, 68],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Resolved Claims',
      data: [34, 42, 54, 58, 63, 62],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Pending Items',
      data: [10, 14, 16, 11, 14, 16],
      borderColor: '#fbbf24',
      backgroundColor: 'rgba(251,191,36,0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const monthlyTrendsOptions = {
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
};

const resolutionData = {
  labels: ['Resolved', 'Pending', 'In Progress'],
  datasets: [
    {
      data: [60, 18, 22],
      backgroundColor: ['#22c55e', '#f87171', '#fbbf24'],
      hoverOffset: 4,
    },
  ],
};

export default function ReportsDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col px-6 py-8">
        <h2 className="text-xl font-bold text-blue-600 mb-8">Lost & Found</h2>
        <nav className="flex-1">
          <ul>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-md mb-2 hover:bg-blue-100"
              >
                <FaChartPie className="w-5 h-5" />
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-md mb-2"
              >
                <FaChartPie className="w-5 h-5" />
                Reports & Analytics
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-auto flex items-center text-gray-400 gap-2">
          <span>&#8678;</span>
          Logout
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports & Analytics</h1>
            <p className="text-gray-500">
              Monitor performance and generate detailed reports
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 gap-2">
            <FaFileExport />
            Export Report
          </button>
        </div>
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Total Verified Items"
            value={354}
            change={12}
          />
          <StatCard
            title="Resolved Claims"
            value={287}
            change={8}
          />
          <StatCard
            title="Average Resolution Time"
            value="3.2 days"
            change={-15}
            negative
          />
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-bold mb-2">Monthly Activity Trends</h2>
            <p className="text-gray-500 mb-2">
              Track verified items, resolved claims, and pending items over time
            </p>
            <Line
              data={monthlyTrendsData}
              options={monthlyTrendsOptions}
              height={200}
              redraw
            />
            <div className="mt-4 flex gap-6 text-sm">
              <span className="text-blue-600">● Verified Items</span>
              <span className="text-green-600">● Resolved Claims</span>
              <span className="text-yellow-600">● Pending Items</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
            <h2 className="text-lg font-bold mb-2">Resolution Status</h2>
            <span className="text-gray-500 mb-2">
              Current status distribution
            </span>
            <Pie data={resolutionData} redraw />
          </div>
        </div>
      </main>
    </div>
  );
}

// Card for stats
function StatCard({ title, value, change, negative }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow flex flex-col gap-2">
      <span className="text-gray-500">{title}</span>
      <span className="text-3xl font-bold">{value}</span>
      <span
        className={`text-sm flex items-center gap-1 ${
          negative ? "text-red-600" : "text-green-600"
        }`}
      >
        {negative ? "▼" : "▲"}
        {change > 0 ? "+" : ""}
        {change}%
        <span className="text-gray-400">Last 30 days</span>
      </span>
    </div>
  );
}
