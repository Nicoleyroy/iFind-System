import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Clock, CheckCircle, XCircle, 
  AlertCircle, Users, Package, Calendar, Download, Filter 
} from 'lucide-react';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { API_ENDPOINTS } from '../../utils/constants';
import ModSidebar from '../layout/ModSidebar';

// Register Chart.js components
ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, statusFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`${API_ENDPOINTS.CLAIMS_ANALYTICS}?${params}`);
      const data = await response.json();
      
      if (data.data) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      dateRange: dateRange.startDate && dateRange.endDate 
        ? `${dateRange.startDate} to ${dateRange.endDate}` 
        : 'All time',
      ...analytics
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `claims-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-6">Error loading analytics</div>;
  }

  // Prepare chart data
  const trendsChartData = {
    labels: analytics.trends.map(t => t.month),
    datasets: [
      {
        label: 'Approved',
        data: analytics.trends.map(t => t.approved),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Rejected',
        data: analytics.trends.map(t => t.rejected),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Pending',
        data: analytics.trends.map(t => t.pending),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const statusDistributionData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [
          analytics.overview.pendingClaims,
          analytics.overview.approvedClaims,
          analytics.overview.rejectedClaims
        ],
        backgroundColor: ['#f59e0b', '#22c55e', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const categoryData = {
    labels: Object.keys(analytics.itemsByCategory),
    datasets: [
      {
        label: 'Claims by Category',
        data: Object.values(analytics.itemsByCategory),
        backgroundColor: [
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#6366f1'
        ],
      },
    ],
  };

  const moderatorData = {
    labels: analytics.moderatorWorkload.map(m => m.moderatorName || 'Unknown'),
    datasets: [
      {
        label: 'Approved',
        data: analytics.moderatorWorkload.map(m => m.approved),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Rejected',
        data: analytics.moderatorWorkload.map(m => m.rejected),
        backgroundColor: '#ef4444',
      },
    ],
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <ModSidebar />
      
      <div className="flex-1 ml-64">
        {/* Compact Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              <p className="text-white/80 text-sm mt-0.5">Monitor performance and generate detailed reports</p>
            </div>

            {/* Right: Export Button & Profile */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-md text-sm"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white text-sm font-semibold leading-tight">{user?.name || 'JOANNA NICOLE YROY'}</p>
                  <p className="text-white/70 text-xs">Moderator</p>
                </div>
                <div className="w-11 h-11 bg-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-lg font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'J'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              
              {(dateRange.startDate || dateRange.endDate || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setDateRange({ startDate: '', endDate: '' });
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              icon={<Package className="w-6 h-6" />}
              title="Total Claims"
              value={analytics.overview.totalClaims}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="Approved"
              value={analytics.overview.approvedClaims}
              bgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              icon={<XCircle className="w-6 h-6" />}
              title="Rejected"
              value={analytics.overview.rejectedClaims}
              bgColor="bg-red-100"
              iconColor="text-red-600"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Trends Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Claims Trend (Last 6 Months)</h2>
              </div>
              <Line 
                data={trendsChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Status Distribution</h2>
              </div>
              <div className="flex justify-center">
                <div className="w-64">
                  <Doughnut 
                    data={statusDistributionData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            {Object.keys(analytics.itemsByCategory).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">Claims by Item Category</h2>
                </div>
                <Bar 
                  data={categoryData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Moderator Workload */}
            {analytics.moderatorWorkload.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">Moderator Workload</h2>
                </div>
                <Bar 
                  data={moderatorData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                    scales: {
                      x: {
                        stacked: true,
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Pending Claims Alert */}
          {analytics.overview.pendingClaims > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Action Required</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    You have <span className="font-bold">{analytics.overview.pendingClaims}</span> pending claim{analytics.overview.pendingClaims !== 1 ? 's' : ''} waiting for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, bgColor, iconColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}