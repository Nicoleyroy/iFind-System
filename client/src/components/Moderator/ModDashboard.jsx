import React from "react";
import { FaCube, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register necessary Chart.js components once per app lifecycle!
ChartJS.register(
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ModeratorDashboard() {
  // Data for the summary cards
  const cards = [
    {
      title: "Total Items",
      value: 342,
      icon: <FaCube className="w-6 h-6 text-blue-500" />,
      change: "+12%",
      changeColor: "text-green-600",
      bg: "bg-blue-50",
    },
    {
      title: "Pending Verifications",
      value: 28,
      icon: <FaClock className="w-6 h-6 text-yellow-500" />,
      change: "-5%",
      changeColor: "text-red-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Active Claims",
      value: 45,
      icon: <FaExclamationCircle className="w-6 h-6 text-gray-500" />,
      change: "+8%",
      changeColor: "text-green-600",
      bg: "bg-gray-50",
    },
    {
      title: "Resolved Today",
      value: 16,
      icon: <FaCheckCircle className="w-6 h-6 text-green-500" />,
      change: "+20%",
      changeColor: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  // Chart Data - Weekly activity
  const weeklyActivityData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Lost/Found Items",
        data: [10, 14, 7, 20, 18, 11, 6],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.15)",
        fill: false,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: "Claims",
        data: [8, 12, 6, 15, 14, 7, 4],
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 4,
      }
    ],
  };

  const weeklyActivityOptions = {
    plugins: { legend: { display: true, position: "bottom" } },
    scales: { y: { beginAtZero: true } },
  };

  // Category bar chart
  const categoryData = {
    labels: ["Accessories", "Clothing", "Keys"],
    datasets: [{
      label: "Items",
      data: [45, 32, 26, 18, 15],
      backgroundColor: "#3b82f6",
      borderRadius: 6,
      maxBarThickness: 40,
    }]
  };
  const categoryOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // Dummy recent activities
  const recentActivities = [
    { id: 1, text: "Claim for 'Red Umbrella' verified.", time: "3 min ago" },
    { id: 2, text: "Added 'Wallet' to lost items.", time: "15 min ago" },
    { id: 3, text: "Resolved claim for 'Bluetooth Headphones'.", time: "33 min ago" },
    { id: 4, text: "Pending verification for 'House Keys'.", time: "1 hr ago" }
  ];

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
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-md mb-2"
              >
                <span className="w-5 h-5 font-extrabold">&#9632;</span>
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-md mb-2 hover:bg-blue-100"
              >
                <span className="w-5 h-5 font-extrabold">&#9632;</span>
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
        <h1 className="text-3xl font-bold mb-1">Dashboard Overview</h1>
        <p className="text-gray-500 mb-8">Monitor system status and key metrics</p>
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, idx) => (
            <div key={idx} className={`rounded-xl shadow bg-white flex gap-4 items-center p-6 ${card.bg}`}>
              <div className="">{card.icon}</div>
              <div>
                <span className="block text-gray-500">{card.title}</span>
                <span className="block text-3xl font-bold">{card.value}</span>
                <span className={`block text-xs font-semibold ${card.changeColor}`}>{card.change}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-1">Weekly Activity</h2>
            <Line
              data={weeklyActivityData}
              options={weeklyActivityOptions}
              height={200}
              redraw
            />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-1">Items by Category</h2>
            <Bar
              data={categoryData}
              options={categoryOptions}
              height={200}
              redraw
            />
          </div>
        </div>
        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <ul>
            {recentActivities.map((act) => (
              <li key={act.id} className="flex justify-between py-2 border-b last:border-none">
                <span className="text-gray-700">{act.text}</span>
                <span className="text-gray-400 text-sm">{act.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
