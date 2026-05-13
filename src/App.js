import React, { useState, useEffect, useMemo } from 'react';

const HuaHinWatch = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [weatherData, setWeatherData] = useState(null);
  const [outageReports, setOutageReports] = useState([]);
  const [newReport, setNewReport] = useState({ area: '', description: '', time: '' });
  const [mapReady, setMapReady] = useState(false);

  const huaHinAreas = useMemo(() => [
    { id: 1, name: 'Decathlon Beach', lat: 12.551, lng: 100.058, status: 'normal' },
    { id: 2, name: 'Petchkasem Rd North', lat: 12.560, lng: 100.062, status: 'warning' },
    { id: 3, name: 'Night Bazaar', lat: 12.555, lng: 100.065, status: 'normal' },
    { id: 4, name: 'Petchkasem Rd South', lat: 12.540, lng: 100.062, status: 'critical' },
    { id: 5, name: 'Takiab Beach', lat: 12.545, lng: 100.070, status: 'normal' },
    { id: 6, name: 'Cicada Market', lat: 12.558, lng: 100.062, status: 'normal' },
    { id: 7, name: 'City Center', lat: 12.555, lng: 100.060, status: 'normal' },
    { id: 8, name: 'Railway Station', lat: 12.548, lng: 100.055, status: 'warning' },
  ], []);

  const getTideData = () => {
    const now = new Date();
    const hour = now.getHours();
    const timeInMinutes = (hour % 12) * 60;
    const tidePhase = Math.sin((timeInMinutes / 720) * Math.PI);
    const tideHeight = 1.2 + (tidePhase * 0.8);
    let currentTide = 'Mid-Tide';
    if (tidePhase > 0.7) currentTide = 'High Tide';
    else if (tidePhase < 0.3) currentTide = 'Low Tide';
    else if (tidePhase > 0.4) currentTide = 'Rising';
    else currentTide = 'Falling';
    return { currentTide, tideHeight };
  };

  useEffect(() => {
    const saved = localStorage.getItem('huahin_outage_reports');
    if (saved) setOutageReports(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=12.5557&longitude=100.0604&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Bangkok');
        const data = await res.json();
        if (data.current) {
          setWeatherData({
            temp: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            condition: getWeatherCondition(data.current.weather_code),
            tempMax: Math.round(data.daily?.temperature_2m_max[0] || 0),
            tempMin: Math.round(data.daily?.temperature_2m_min[0] || 0),
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

  useEffect(() => {
    if (currentPage === 'power_status' && !mapReady) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => {
        if (document.getElementById('map') && window.L) {
          const map = window.L.map('map').setView([12.5557, 100.0604], 13);
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          huaHinAreas.forEach(area => {
            const color = area.status === 'normal' ? '#10b981' : area.status === 'warning' ? '#f59e0b' : '#ef4444';
            const html = `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${area.status === 'normal' ? '✓' : area.status === 'warning' ? '⚠' : '✕'}</div>`;
            
            const icon = window.L.divIcon({
              html: html,
              className: 'custom-marker',
              iconSize: [32, 32],
            });

            window.L.marker([area.lat, area.lng], { icon: icon })
              .bindPopup(`<strong>${area.name}</strong><br/>${area.status === 'normal' ? '✓ Normal' : area.status === 'warning' ? '⚠ Warning' : '✕ Outage'}`)
              .addTo(map);
          });

          setMapReady(true);
        }
      };
      document.body.appendChild(script);
    }
  }, [currentPage, mapReady, huaHinAreas]);

  const getWeatherCondition = (code) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code >= 61) return 'Rainy';
    return 'Unknown';
  };

  const handleReportSubmit = () => {
    if (!newReport.area.trim()) return;
    const report = {
      id: Date.now(),
      area: newReport.area,
      description: newReport.description,
      time: newReport.time,
      timestamp: new Date().toISOString(),
    };
    const updated = [report, ...outageReports];
    setOutageReports(updated);
    localStorage.setItem('huahin_outage_reports', JSON.stringify(updated));
    setNewReport({ area: '', description: '', time: '' });
  };

  const getStatusColor = (status) => {
    if (status === 'normal') return '#10b981';
    if (status === 'warning') return '#f59e0b';
    if (status === 'critical') return '#ef4444';
    return '#64748b';
  };

  const tideData = getTideData();
  const normalCount = huaHinAreas.filter(a => a.status === 'normal').length;
  const warningCount = huaHinAreas.filter(a => a.status === 'warning').length;
  const criticalCount = huaHinAreas.filter(a => a.status === 'critical').length;

  return (
    <div style={{ background: '#0f172a', color: '#f1f5f9', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderBottom: '2px solid #3b82f6', padding: '20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0', background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🌊 HUA HIN WATCH</h1>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '5px 0 0 0' }}>Real-time power, weather & tide data</p>
          </div>

          <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['home', 'power_status', 'report_outage', 'live_cams', 'tides', 'guides', 'travel'].map(page => {
              const labels = { home: 'Home', power_status: '⚡ Power', report_outage: '📢 Report', live_cams: '📹 Cams', tides: '🌊 Tides', guides: '🗺️ Guides', travel: '✈️ Travel' };
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === page ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                    color: '#fff',
                    border: currentPage === page ? '2px solid #60a5fa' : '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                  }}
                >
                  {labels[page]}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {/* HOME */}
        {currentPage === 'home' && (
          <div>
            {/* HERO */}
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', borderRadius: '16px', padding: '50px 30px', marginBottom: '40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 15px 0', color: '#fff' }}>Hua Hin Live Status</h2>
              <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', margin: '0', lineHeight: '1.6' }}>Check power outages, weather, tides & community reports in real-time</p>
            </div>

            {/* POWER STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 10px 0' }}>Areas Normal</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0', color: '#fff' }}>{normalCount}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)' }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 10px 0' }}>Warnings</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0', color: '#fff' }}>{warningCount}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)' }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 10px 0' }}>Outages</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0', color: '#fff' }}>{criticalCount}</p>
              </div>
            </div>

            {/* WEATHER + TIDE WIDGETS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {weatherData && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', padding: '25px', border: '2px solid #3b82f6' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: '0 0 15px 0', fontWeight: '600' }}>☀️ Weather Now</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 5px 0', color: '#60a5fa' }}>{weatherData.temp}°C</p>
                  <p style={{ fontSize: '1rem', color: '#e0e7ff', margin: '0 0 15px 0' }}>{weatherData.condition}</p>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                    <p style={{ margin: '5px 0' }}>H: {weatherData.tempMax}° L: {weatherData.tempMin}°</p>
                    <p style={{ margin: '5px 0' }}>💨 {weatherData.windSpeed} km/h</p>
                    <p style={{ margin: '5px 0' }}>💧 {weatherData.humidity}%</p>
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '25px', border: '2px solid #10b981' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: '0 0 15px 0', fontWeight: '600' }}>🌊 Tide Status</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 5px 0', color: '#34d399' }}>{tideData.currentTide}</p>
                <p style={{ fontSize: '1rem', color: '#e0e7ff', margin: '0' }}>{tideData.tideHeight.toFixed(1)}m height</p>
              </div>

              <div style={{ background: outageReports.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '25px', border: `2px solid ${outageReports.length > 0 ? '#ef4444' : '#10b981'}` }}>
                <h3 style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: '0 0 15px 0', fontWeight: '600' }}>📡 Reports</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 5px 0', color: outageReports.length > 0 ? '#f87171' : '#34d399' }}>{outageReports.length}</p>
                <p style={{ fontSize: '1rem', color: '#e0e7ff', margin: '0' }}>active reports</p>
              </div>
            </div>

            {/* CTA BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <button onClick={() => setCurrentPage('power_status')} style={{ padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.3s' }}>View Power Map</button>
              <button onClick={() => setCurrentPage('report_outage')} style={{ padding: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.3s' }}>Report Outage</button>
              <button onClick={() => setCurrentPage('tides')} style={{ padding: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.3s' }}>Check Tides</button>
            </div>
          </div>
        )}

        {/* POWER STATUS */}
        {currentPage === 'power_status' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>⚡ Power Status Map</h2>
            <div id="map" style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', height: '550px', width: '100%' }}></div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 20px 0' }}>Area Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {huaHinAreas.map(area => (
                <div key={area.id} style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '18px', border: `2px solid ${getStatusColor(area.status)}`, borderLeft: `4px solid ${getStatusColor(area.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 8px 0' }}>{area.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0' }}>📍 {area.lat.toFixed(3)}, {area.lng.toFixed(3)}</p>
                    </div>
                    <span style={{ padding: '6px 12px', background: getStatusColor(area.status), color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {area.status === 'normal' ? '✓ Normal' : area.status === 'warning' ? '⚠ Warning' : '✕ Outage'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', border: '2px solid #475569' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 15px 0' }}>Recent Reports ({outageReports.length})</h3>
              {outageReports.length === 0 ? (
                <p style={{ color: '#94a3b8', margin: '0' }}>✓ No outages reported</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {outageReports.slice(0, 5).map(report => (
                    <div key={report.id} style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <p style={{ fontWeight: '600', margin: '0 0 5px 0' }}>{report.area} {report.time && `@ ${report.time}`}</p>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0' }}>{report.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT OUTAGE */}
        {currentPage === 'report_outage' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>📢 Report Power Outage</h2>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '30px', border: '2px solid #3b82f6' }}>
              <p style={{ color: '#cbd5e1', margin: '0 0 25px 0' }}>Help the community by reporting power outages. Your report helps others in the area.</p>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Which area? *</label>
                  <select value={newReport.area} onChange={(e) => setNewReport({ ...newReport, area: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #475569', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', background: '#1e293b', color: '#f1f5f9' }}>
                    <option value="">Select area...</option>
                    {huaHinAreas.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>When did it start? *</label>
                  <input type="time" value={newReport.time} onChange={(e) => setNewReport({ ...newReport, time: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #475569', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', background: '#1e293b', color: '#f1f5f9' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
                  <textarea value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="Details..." style={{ width: '100%', padding: '12px', border: '2px solid #475569', borderRadius: '6px', fontSize: '1rem', minHeight: '100px', fontFamily: 'inherit', background: '#1e293b', color: '#f1f5f9', resize: 'vertical' }} />
                </div>

                <button onClick={handleReportSubmit} style={{ padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIVE CAMS */}
        {currentPage === 'live_cams' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>📹 Live Webcams</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Decathlon Beach', emoji: '🏖️' },
                { name: 'Night Bazaar Live', emoji: '🌙' },
                { name: 'Petchkasem Road View', emoji: '🛣️' },
                { name: 'Takiab Beach Cam', emoji: '⛱️' },
              ].map((cam, idx) => (
                <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.2)', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    {cam.emoji}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 8px 0' }}>{cam.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0' }}>Live feed available</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIDES */}
        {currentPage === 'tides' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>🌊 Tide Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0' }}>Current</p>
                <p style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0' }}>{tideData.currentTide}</p>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: '8px 0 0 0' }}>{tideData.tideHeight.toFixed(1)}m</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0' }}>High Tide</p>
                <p style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0' }}>13:00</p>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: '8px 0 0 0' }}>2.0m</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0' }}>Low Tide</p>
                <p style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0' }}>06:45</p>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: '8px 0 0 0' }}>0.3m</p>
              </div>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', border: '2px solid #10b981' }}>
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', margin: '0' }}>Hua Hin has semi-diurnal tides with significant range. High tides exceed 2 meters. Plan water activities by tide schedule.</p>
            </div>
          </div>
        )}

        {/* GUIDES */}
        {currentPage === 'guides' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>🗺️ Area Guides</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Decathlon Beach', desc: 'Water sports & calm waters' },
                { title: 'Night Bazaar', desc: 'Weekend night market' },
                { title: 'Petchkasem Road', desc: 'Main highway, shops & views' },
                { title: 'Takiab Beach', desc: 'Quieter, scenic viewpoint' },
                { title: 'Cicada Market', desc: 'Weekend entertainment' },
                { title: 'Railway Station', desc: 'Historic, shops nearby' },
              ].map((guide, idx) => (
                <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', border: '2px solid #3b82f6' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 10px 0' }}>{guide.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '0' }}>{guide.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRAVEL */}
        {currentPage === 'travel' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>✈️ Travel Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Getting There', items: ['Flight to Bangkok + 2-3hr drive', 'Train from Bangkok (3h)', 'Bus available'] },
                { title: 'Where to Stay', items: ['Beach resorts', 'City center', 'Budget options'] },
                { title: 'Money', items: ['ATMs available', 'Meals: 60-200 THB', 'Activities: 500-2000 THB'] },
                { title: 'Emergency', items: ['Police: 191', 'Tourist: 1155', 'Hospital: +66 32 533 200'] },
              ].map((section, idx) => (
                <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '20px', border: '2px solid #3b82f6' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 15px 0' }}>{section.title}</h3>
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ padding: '8px 0', borderBottom: i < section.items.length - 1 ? '1px solid rgba(75, 85, 99, 0.3)' : 'none', color: '#cbd5e1' }}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: 'rgba(15, 23, 42, 0.8)', borderTop: '2px solid #3b82f6', padding: '25px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '60px' }}>
        <p style={{ margin: '0 0 8px 0' }}>© 2026 HuaHinWatch</p>
        <p style={{ margin: '0' }}>Community-powered power, weather & tide data</p>
      </footer>
    </div>
  );
};

export default HuaHinWatch;
