import React, { useState, useEffect } from 'react';
import { Home, Zap, MessageSquare, BookOpen, Plane, Waves } from 'lucide-react';

const HuaHinWatch = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [weatherData, setWeatherData] = useState(null);
  const [tideData, setTideData] = useState(null);
  const [outageReports, setOutageReports] = useState([]);
  const [newReport, setNewReport] = useState({ area: '', description: '' });
  const [time, setTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);

  const huaHinAreas = [
    { id: 1, name: 'Decathlon Beach', lat: 12.551, lng: 100.058, status: 'normal' },
    { id: 2, name: 'Petchkasem Rd North', lat: 12.560, lng: 100.062, status: 'warning' },
    { id: 3, name: 'Night Bazaar', lat: 12.555, lng: 100.065, status: 'normal' },
    { id: 4, name: 'Petchkasem Rd South', lat: 12.540, lng: 100.062, status: 'critical' },
    { id: 5, name: 'Takiab Beach', lat: 12.545, lng: 100.070, status: 'normal' },
    { id: 6, name: 'Cicada Market', lat: 12.558, lng: 100.062, status: 'normal' },
    { id: 7, name: 'City Center', lat: 12.555, lng: 100.060, status: 'normal' },
    { id: 8, name: 'Railway Station', lat: 12.548, lng: 100.055, status: 'normal' },
  ];

  // Mock tide data for Hua Hin (realistic times)
  const generateTideData = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentMinutes = hour * 60 + minute;

    // Hua Hin typical tide pattern (semi-diurnal)
    const tides = [
      { time: '00:30', type: 'High', height: 2.1 },
      { time: '06:45', type: 'Low', height: 0.3 },
      { time: '13:00', type: 'High', height: 2.0 },
      { time: '19:15', type: 'Low', height: 0.4 },
    ];

    // Find current tide position
    let currentTide = 'Mid-Tide';
    let tideHeight = 1.0;
    let tidePhase = 0.5;

    const timeInMinutes = (hour % 12) * 60 + minute;
    tidePhase = Math.sin((timeInMinutes / 720) * Math.PI);
    tideHeight = 1.2 + (tidePhase * 0.8);

    if (tidePhase > 0.7) currentTide = 'High Tide';
    else if (tidePhase < 0.3) currentTide = 'Low Tide';
    else if (tidePhase > 0.4) currentTide = 'Rising';
    else currentTide = 'Falling';

    return { tides, currentTide, tideHeight, tidePhase };
  };

  useEffect(() => {
    const saved = localStorage.getItem('huahin_outage_reports');
    if (saved) setOutageReports(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      setTime(newTime);
      
      // Auto-switch theme based on sunrise/sunset (approximate for Hua Hin)
      const hour = newTime.getHours();
      setIsDarkMode(hour < 6 || hour > 18);
      
      setTideData(generateTideData());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=12.5557&longitude=100.0604&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=Asia/Bangkok');
        const data = await res.json();
        if (data.current) {
          setWeatherData({
            temp: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            condition: getWeatherCondition(data.current.weather_code),
            icon: getWeatherIcon(data.current.weather_code),
            tempMax: Math.round(data.daily?.temperature_2m_max[0] || 0),
            tempMin: Math.round(data.daily?.temperature_2m_min[0] || 0),
            rainChance: data.daily?.precipitation_probability_max[0] || 0,
          });
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherCondition = (code) => {
    const conditions = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 80: 'Rain showers', 95: 'Thunderstorm' };
    return conditions[code] || 'Unknown';
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code >= 61 && code <= 80) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleReportSubmit = () => {
    if (!newReport.area.trim()) return;
    const report = {
      id: Date.now(),
      area: newReport.area,
      description: newReport.description,
      timestamp: new Date().toISOString(),
      status: 'outage',
    };
    const updated = [report, ...outageReports];
    setOutageReports(updated);
    localStorage.setItem('huahin_outage_reports', JSON.stringify(updated));
    setNewReport({ area: '', description: '' });
  };

  const getStatusColor = (status) => {
    const colors = { normal: '#10b981', warning: '#f59e0b', critical: '#ef4444' };
    return colors[status] || '#64748b';
  };

  const getStatusLabel = (status) => {
    const labels = { normal: 'Normal', warning: 'Warning', critical: 'Outage' };
    return labels[status] || 'Unknown';
  };

  const TideWaveVisualization = ({ tideData }) => {
    if (!tideData) return null;

    const wavePoints = [];
    for (let x = 0; x <= 100; x += 2) {
      const y = 50 + Math.sin((x / 100) * Math.PI * 2 + Date.now() / 1000) * 15 + (tideData.tidePhase - 0.5) * 30;
      wavePoints.push(`${x},${y}`);
    }
    const pathData = `M${wavePoints.join(' L')} L100,100 L0,100 Z`;

    return (
      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>🌊 Tide Status</h3>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0', color: '#06b6d4' }}>{tideData.currentTide}</p>
            <p style={{ fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#666', margin: '0' }}>Height: {tideData.tideHeight.toFixed(1)}m</p>
          </div>
        </div>

        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '250px', background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(200, 220, 240, 0.2)', borderRadius: '12px', border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}` }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          <path d={pathData} fill="url(#waveGradient)" opacity="0.8" />
          <circle cx={tideData.tidePhase * 100} cy={50 + (tideData.tidePhase - 0.5) * 30} r="3" fill="#ef4444" stroke="white" strokeWidth="1" />
        </svg>

        <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {tideData.tides.slice(0, 4).map((tide, idx) => (
            <div key={idx} style={{ padding: '12px', background: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#666', margin: '0 0 5px 0' }}>{tide.type}</p>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0' }}>{tide.time}</p>
              <p style={{ fontSize: '0.85rem', color: isDarkMode ? '#64748b' : '#999', margin: '5px 0 0 0' }}>{tide.height}m</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: isDarkMode ? '#0f172a' : '#f8f9fa',
      color: isDarkMode ? '#f1f5f9' : '#1a1a1a',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '0',
      transition: 'background 0.5s ease, color 0.5s ease',
    }}>
      <header style={{
        background: isDarkMode ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
        borderBottom: `2px solid ${isDarkMode ? '#3b82f6' : '#0284c7'}`,
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '900',
                margin: '0 0 5px 0',
                background: isDarkMode ? 'linear-gradient(90deg, #60a5fa, #34d399)' : 'linear-gradient(90deg, #0284c7, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>HUA HIN WATCH</h1>
              <p style={{ fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#666', margin: '0' }}>Community-powered reports • {formatTime(time)} ICT</p>
            </div>
            {weatherData && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '3rem', marginBottom: '5px' }}>{weatherData.icon}</div>
                <p style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0' }}>{weatherData.temp}°C</p>
                <p style={{ fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#666', margin: '0' }}>{weatherData.condition}</p>
              </div>
            )}
          </div>

          <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { key: 'home', label: 'Home', icon: Home },
              { key: 'tides', label: 'Tides', icon: Waves },
              { key: 'power', label: 'Power Status', icon: Zap },
              { key: 'report', label: 'Report', icon: MessageSquare },
              { key: 'guides', label: 'Guides', icon: BookOpen },
              { key: 'travel', label: 'Travel', icon: Plane },
            ].map(nav => (
              <button
                key={nav.key}
                onClick={() => setCurrentPage(nav.key)}
                style={{
                  padding: '10px 16px',
                  background: currentPage === nav.key ? (isDarkMode ? '#3b82f6' : '#0284c7') : 'transparent',
                  border: currentPage === nav.key ? `2px solid ${isDarkMode ? '#60a5fa' : '#0ea5e9'}` : `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                  color: currentPage === nav.key ? '#fff' : (isDarkMode ? '#cbd5e1' : '#1a1a1a'),
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <nav.icon size={18} />
                {nav.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {/* TIDES PAGE */}
        {currentPage === 'tides' && tideData && (
          <div>
            <TideWaveVisualization tideData={tideData} />
            
            <div style={{
              background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '25px',
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>📚 Tide Info</h2>
              <p style={{ color: isDarkMode ? '#cbd5e1' : '#666', lineHeight: '1.8', margin: '0' }}>
                Hua Hin experiences semi-diurnal tides with significant tidal range. The bay's geography creates some of Thailand's most dramatic tide changes. High tides can exceed 2 meters, making beach access and water activities highly time-dependent. Check the tide status before planning water activities, boat trips, or beach exploration.
              </p>
            </div>
          </div>
        )}

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {weatherData && (
              <div style={{
                background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '25px',
              }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>☀️ Hua Hin Weather</h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.85rem', margin: '0' }}>Temperature</p><p style={{ fontSize: '2rem', fontWeight: '900', margin: '0', color: '#60a5fa' }}>{weatherData.temp}°C</p></div>
                  <div><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.85rem', margin: '0' }}>Feels like</p><p style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0' }}>{weatherData.feelsLike}°C</p></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Humidity</p><p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>{weatherData.humidity}%</p></div>
                    <div><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Wind</p><p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>{weatherData.windSpeed} km/h</p></div>
                  </div>
                  <div><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Today</p><p style={{ fontSize: '1rem', fontWeight: '700', margin: '0' }}>High {weatherData.tempMax}° | Low {weatherData.tempMin}° | {weatherData.rainChance}% rain</p></div>
                </div>
              </div>
            )}

            <div style={{
              background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '25px',
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>🌊 Tides</h2>
              <p style={{ color: isDarkMode ? '#94a3b8' : '#666', margin: '0 0 15px 0' }}>Check live tide status and plan your beach activities</p>
              <button onClick={() => setCurrentPage('tides')} style={{ padding: '10px 15px', background: isDarkMode ? '#3b82f6' : '#0284c7', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>View Tide Chart →</button>
            </div>

            <div style={{
              background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '25px',
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>⚡ Power Status</h2>
              <p style={{ color: isDarkMode ? '#94a3b8' : '#666', margin: '0 0 15px 0' }}>Community reports on power outages</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {outageReports.length > 0 ? (
                  <>
                    <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', margin: '0' }}>🔴 {outageReports.length} active reports</p>
                    <button onClick={() => setCurrentPage('power')} style={{ padding: '10px 15px', background: isDarkMode ? '#3b82f6' : '#0284c7', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>View Map →</button>
                  </>
                ) : (
                  <p style={{ fontSize: '1rem', color: '#10b981', fontWeight: '600', margin: '0' }}>✓ No outages reported</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* POWER STATUS PAGE */}
        {currentPage === 'power' && (
          <div style={{
            background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
            border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
            borderRadius: '12px',
            padding: '25px',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 20px 0' }}>⚡ Power Status Map</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '8px' }}><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.85rem', margin: '0 0 5px 0' }}>Normal</p><p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', margin: '0' }}>{huaHinAreas.filter(a => a.status === 'normal').length}</p></div>
              <div style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.1)', border: '2px solid #f59e0b', borderRadius: '8px' }}><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.85rem', margin: '0 0 5px 0' }}>Warning</p><p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b', margin: '0' }}>{huaHinAreas.filter(a => a.status === 'warning').length}</p></div>
              <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', borderRadius: '8px' }}><p style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '0.85rem', margin: '0 0 5px 0' }}>Outage</p><p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', margin: '0' }}>{huaHinAreas.filter(a => a.status === 'critical').length}</p></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
              {huaHinAreas.map(area => (
                <div key={area.id} style={{ padding: '15px', background: `rgba(${getStatusColor(area.status).includes('10b981') ? '16, 185, 129' : getStatusColor(area.status).includes('f59e0b') ? '245, 158, 11' : '239, 68, 68'}, 0.1)`, border: `2px solid ${getStatusColor(area.status)}`, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <p style={{ fontWeight: '700', margin: '0 0 5px 0' }}>{area.name}</p>
                      <p style={{ fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#666', margin: '0' }}>📍 {area.lat.toFixed(3)}, {area.lng.toFixed(3)}</p>
                    </div>
                    <span style={{ padding: '4px 10px', background: getStatusColor(area.status), color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{getStatusLabel(area.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORT PAGE */}
        {currentPage === 'report' && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{
              background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '25px',
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 20px 0' }}>📢 Report Power Outage</h2>
              <p style={{ color: isDarkMode ? '#94a3b8' : '#666', marginBottom: '20px' }}>Help the community by reporting power outages</p>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Area *</label><select value={newReport.area} onChange={(e) => setNewReport({ ...newReport, area: e.target.value })} style={{ width: '100%', padding: '12px', background: isDarkMode ? '#1e293b' : '#f0f0f0', border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`, color: isDarkMode ? '#f1f5f9' : '#1a1a1a', borderRadius: '6px', fontSize: '1rem' }}><option value="">Select area...</option>{huaHinAreas.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}</select></div>
                <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label><textarea value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="When did it start?" style={{ width: '100%', padding: '12px', background: isDarkMode ? '#1e293b' : '#f0f0f0', border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`, color: isDarkMode ? '#f1f5f9' : '#1a1a1a', borderRadius: '6px', fontSize: '1rem', minHeight: '100px', fontFamily: 'inherit' }} /></div>
                <button onClick={handleReportSubmit} style={{ padding: '12px 20px', background: isDarkMode ? '#3b82f6' : '#0284c7', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Submit Report</button>
              </div>
            </div>
          </div>
        )}

        {/* GUIDES PAGE */}
        {currentPage === 'guides' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              { title: 'Decathlon Beach', desc: 'Popular water sports beach with calm waters and easy beach access.' },
              { title: 'Night Bazaar', desc: 'Weekend night market with street food, crafts and local vibes.' },
              { title: 'Petchkasem Road', desc: 'Main coastal highway with shops, restaurants and viewpoints.' },
              { title: 'Takiab Beach', desc: 'Quieter northern beach with scenic viewpoint and local cafes.' },
              { title: 'Cicada Market', desc: 'Popular night market (weekends) with local food and crafts.' },
              { title: 'Railway Station', desc: 'Historic station with nearby hotels, shops and restaurants.' },
            ].map((guide, idx) => (
              <div key={idx} style={{
                background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 10px 0' }}>{guide.title}</h3>
                <p style={{ color: isDarkMode ? '#cbd5e1' : '#666', margin: '0', lineHeight: '1.6' }}>{guide.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TRAVEL PAGE */}
        {currentPage === 'travel' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              { icon: '✈️', title: 'Getting to Hua Hin', items: ['Flight to Bangkok, then 2-3hr drive', 'Train from Bangkok (3 hours)', 'Bus services available'] },
              { icon: '🏨', title: 'Where to Stay', items: ['Beach resorts (Decathlon area)', 'City center hotels (convenient)', 'Quieter areas (Takiab, Maenam)'] },
              { icon: '💰', title: 'Money & Costs', items: ['ATMs widely available', 'Average meal: 60-150 THB', 'Beach activities: 500-2000 THB'] },
              { icon: '📞', title: 'Useful Numbers', items: ['Emergency: 191', 'Tourist police: 1155', 'Hua Hin Hospital: +66 32 533 200'] },
            ].map((section, idx) => (
              <div key={idx} style={{
                background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 15px 0' }}>{section.icon} {section.title}</h3>
                <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ padding: '8px 0', borderBottom: i < section.items.length - 1 ? `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}` : 'none', color: isDarkMode ? '#cbd5e1' : '#1a1a1a' }}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{
        background: isDarkMode ? '#0f172a' : '#f8f9fa',
        borderTop: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
        padding: '25px',
        textAlign: 'center',
        color: isDarkMode ? '#64748b' : '#999',
        fontSize: '0.85rem',
        marginTop: '40px',
      }}>
        <p style={{ margin: '0 0 10px 0' }}>© 2026 HuaHinWatch • Community-powered outage reports</p>
        <p style={{ margin: '0' }}>Not affiliated with PEA. Reports are user-submitted and unverified.</p>
      </footer>
    </div>
  );
};

export default HuaHinWatch;
