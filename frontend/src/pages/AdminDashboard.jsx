import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  DoorOpen, 
  CalendarClock, 
  FileCheck2, 
  AlertCircle,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/allocations/analytics');
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch analytics failed:', err);
      setError('Failed to load dashboard statistics.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Generating dashboard insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge rejected" style={{ display: 'flex', gap: '8px', padding: '16px', borderRadius: '12px', alignItems: 'center' }}>
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const { metrics, charts } = data;

  // Chart 1: Nurse Status Doughnut Chart
  const statusLabels = charts.nurseStatus.map(item => item.status === 'active' ? 'Active Staff' : 'Inactive Staff');
  const statusValues = charts.nurseStatus.map(item => item.count);
  
  const statusData = {
    labels: statusLabels.length ? statusLabels : ['No Data'],
    datasets: [{
      label: 'Nurse Status Count',
      data: statusValues.length ? statusValues : [0],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2
    }]
  };

  // Chart 2: Shift Distribution Bar Chart
  const shiftLabels = charts.shiftDistribution.map(item => item.shift_name);
  const shiftValues = charts.shiftDistribution.map(item => item.count);

  const shiftData = {
    labels: shiftLabels.length ? shiftLabels : ['Morning', 'Evening', 'Night'],
    datasets: [{
      label: 'Allocated Shifts',
      data: shiftValues.length ? shiftValues : [0, 0, 0],
      backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6'],
      borderRadius: 6
    }]
  };

  // Chart 3: Weekly Allocations Line Chart
  const trendLabels = charts.weeklyTrend.map(item => {
    // Format YYYY-MM-DD into a shorter format e.g., Jun 15
    const dateObj = new Date(item.date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  });
  const trendValues = charts.weeklyTrend.map(item => item.count);

  const trendData = {
    labels: trendLabels.length ? trendLabels : ['Today'],
    datasets: [{
      label: 'Daily Allocations Count',
      data: trendValues.length ? trendValues : [0],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      tension: 0.3,
      fill: true
    }]
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Command Center</h1>
          <p>Real-time analytics and workforce status at a glance.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Nurses</span>
            <span className="stat-value">{metrics.totalNurses}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CalendarClock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Shifts Today</span>
            <span className="stat-value">{metrics.activeShiftsToday}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <FileCheck2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Available Staff Today</span>
            <span className="stat-value">{metrics.availableNursesToday}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Leaves</span>
            <span className="stat-value">{metrics.pendingLeaves}</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="analytics-grid">
        {/* Weekly Allocations Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 className="chart-title">Weekly Allocations Trend</h3>
          </div>
          <div className="chart-body">
            {trendValues.length > 0 ? (
              <Line 
                data={trendData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No allocation data for the last 7 days.</p>
            )}
          </div>
        </div>

        {/* Shift Distribution Bar Chart */}
        <div className="chart-card">
          <div className="chart-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--primary)" />
            <h3 className="chart-title">Shift Load Distribution</h3>
          </div>
          <div className="chart-body">
            {shiftValues.length > 0 ? (
              <Bar 
                data={shiftData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No shift data allocated.</p>
            )}
          </div>
        </div>

        {/* Nurse Availability Status Doughnut Chart */}
        <div className="chart-card">
          <div className="chart-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="var(--primary)" />
            <h3 className="chart-title">Staff Availability Ratio</h3>
          </div>
          <div className="chart-body">
            {statusValues.length > 0 ? (
              <div style={{ width: '220px', height: '220px' }}>
                <Doughnut 
                  data={statusData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }} 
                />
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No staff registered.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
