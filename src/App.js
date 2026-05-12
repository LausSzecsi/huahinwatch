import React, { useState, useEffect } from 'react';

const HuaHinWatch = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [weatherData, setWeatherData] = useState(null);
  const [outageReports, setOutageReports] = useState([]);
  const [newReport, setNewReport] = useState({ area: '', description: '', time: '' });
  const [mapReady, setMapReady] = useState(false);

  const huaHinAreas = [
    { id: 1, name: 'Decathlon Beach', lat: 12.551, lng: 100.058, status: 'normal' },
    { id: 2, name: 'Petchkasem Rd North', lat: 12.560, lng: 100.062, status: 'warning' },
    { id: 3, name: 'Night Bazaar', lat: 12.555, lng: 100.065, status: 'normal' },
    { id: 4, name: 'Petchkasem Rd South', lat: 12.540, lng: 100.062, status: 'critical' },
    { id: 5, name: 'Takiab Beach', lat: 12.545, lng: 100.070, status: 'normal' },
    { id: 6, name: 'Cicada Market', lat: 12.558, lng: 100.062, status: 'normal' },
    { id: 7, name: 'City Center', lat: 12.555, lng: 100.060, status: 'normal' },
    { id: 8, name: 'Railway Station', lat: 12.548, lng: 100.055, status: 'warning' },
  ];

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

  // Initialize Leaflet map
  useEffect(() => {
    if (currentPage === 'power_status' && !mapReady) {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => {
        if (document.getElementById('map') && window.L) {
          const map = window.L.map('map').setView([12.5557, 100.0604], 13);
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          // Add markers for each area
          huaHinAreas.forEach(area => {
            const color = area.status === 'normal' ? '#10b981' : area.status === 'warning' ? '#f59e0b' : '#ef4444';
            const html = `
              <div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; cursor: pointer;">
                ${area.status === 'normal' ? '✓' : area.status === 'warning' ? '⚠' : '✕'}
              </div>
            `;
            
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
  }, [currentPage, mapReady]);

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

  const getStatusLabel = (status) => {
    if (status === 'normal') return '✓ Normal';
    if (status === 'warning') return '⚠ Warning';
    if (status === 'critical') return '✕ Outage';
    return 'Unknown';
  };

  const tideData = getTideData();

  return (
    <div style={{ background: '#f5f5f5', color: '#1a1a1a', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0', color: '#0066cc' }}>HUA HIN WATCH</h1>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '0' }}>Sawasdee! Community reports, live info and resources for Hua Hin</p>
            </div>
            <button style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '15px', background: '#fff', cursor: 'pointer' }}>🌙</button>
          </div>

          <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['Home', 'Power Status', 'Report outage', 'Live cams', 'Tides', 'Guides', 'Travel'].map(label => (
              <button
                key={label}
                onClick={() => setCurrentPage(label.toLowerCase().replace(/\s/g, '_'))}
                style={{
                  padding: '8px 18px',
                  background: currentPage === label.toLowerCase().replace(/\s/g, '_') ? '#0066cc' : '#fff',
                  color: currentPage === label.toLowerCase().replace(/\s/g, '_') ? '#fff' : '#1a1a1a',
                  border: currentPage === label.toLowerCase().replace(/\s/g, '_') ? 'none' : '1px solid #ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: currentPage === label.toLowerCase().replace(/\s/g, '_') ? '600' : '500',
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* HOME */}
        {currentPage === 'home' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #cce5ff 0%, #e6f2ff 100%)', borderRadius: '12px', padding: '40px', marginBottom: '40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: '700', margin: '0 0 20px 0', color: '#01579b' }}>Hua Hin guide: things to do, travel tips & power status</h2>
                  <p style={{ fontSize: '1rem', color: '#1a1a1a', margin: '0 0 25px 0', lineHeight: '1.6' }}>Discover beaches, viewpoints, markets and travel basics for Hua Hin. Check live power status, see tides, cams and community resources.</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['Power Status', 'Report outage', 'Live cams', 'Tides'].map(label => (
                      <button key={label} onClick={() => setCurrentPage(label.toLowerCase().replace(/\s/g, '_'))} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #bbb', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(180deg, #fff9e6 0%, #ffe6b3 100%)', borderRadius: '12px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '120px', height: '120px', background: '#ff9800', borderRadius: '50%' }}></div>
                </div>
              </div>
            </div>

            {weatherData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 15px 0' }}>Weather Now</h3>
                  <p style={{ fontSize: '2.2rem', fontWeight: '700', margin: '0 0 5px 0', color: '#ff6b00' }}>{weatherData.temp}°C</p>
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>{weatherData.condition}</p>
                  <p style={{ fontSize: '0.85rem', color: '#999', margin: '10px 0 0 0' }}>H: {weatherData.tempMax}° L: {weatherData.tempMin}° | {weatherData.humidity}% humidity</p>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 15px 0' }}>Tide Status</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0', color: '#0066cc' }}>{tideData.currentTide} - {tideData.tideHeight.toFixed(1)}m</p>
                  <p style={{ fontSize: '0.85rem', color: '#999', margin: '10px 0 0 0' }}>Updated just now</p>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 15px 0' }}>Power Status</h3>
                  <p style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0', color: outageReports.length > 0 ? '#ef4444' : '#10b981' }}>
                    {outageReports.length > 0 ? `${outageReports.length} reports` : 'All normal'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#999', margin: '10px 0 0 0' }}>Last updated now</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* POWER STATUS - LEAFLET MAP */}
        {currentPage === 'power_status' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>⚡ Power Status Map</h2>
            
            {/* LEAFLET MAP */}
            <div id="map" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '500px', width: '100%' }}></div>

            {/* AREA GRID */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 20px 0' }}>Area Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {huaHinAreas.map(area => (
                <div key={area.id} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${getStatusColor(area.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 8px 0' }}>{area.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 8px 0' }}>📍 {area.lat.toFixed(3)}, {area.lng.toFixed(3)}</p>
                    </div>
                    <span style={{ padding: '4px 12px', background: getStatusColor(area.status), color: '#fff', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {getStatusLabel(area.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* RECENT REPORTS */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 15px 0' }}>Recent Reports ({outageReports.length})</h3>
              {outageReports.length === 0 ? (
                <p style={{ color: '#666', margin: '0' }}>No outage reports yet</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {outageReports.slice(0, 5).map(report => (
                    <div key={report.id} style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <p style={{ fontWeight: '600', margin: '0 0 5px 0' }}>{report.area} {report.time && `@ ${report.time}`}</p>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: '0' }}>{report.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT OUTAGE - FORM */}
        {currentPage === 'report_outage' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>📢 Report Power Outage</h2>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#666', margin: '0 0 25px 0' }}>Help the community by reporting power outages. Your report helps others know what's happening in real time.</p>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem' }}>Which area? *</label>
                  <select value={newReport.area} onChange={(e) => setNewReport({ ...newReport, area: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit' }}>
                    <option value="">Select area...</option>
                    {huaHinAreas.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem' }}>When did it start? *</label>
                  <input type="time" value={newReport.time} onChange={(e) => setNewReport({ ...newReport, time: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem' }}>Description</label>
                  <textarea value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="Any other details? Affected areas? When was power restored?" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', minHeight: '120px', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>

                <button onClick={handleReportSubmit} style={{ padding: '14px', background: '#0066cc', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>
                  Submit Report
                </button>
              </div>

              {outageReports.length > 0 && (
                <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 15px 0' }}>Your Recent Reports</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {outageReports.slice(0, 3).map(report => (
                      <div key={report.id} style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px', fontSize: '0.9rem' }}>
                        <strong>{report.area}</strong> at {report.time || 'unknown time'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIVE CAMS */}
        {currentPage === 'live_cams' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>📹 Live Webcams</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Decathlon Beach', url: '#' },
                { name: 'Night Bazaar Live', url: '#' },
                { name: 'Petchkasem Road View', url: '#' },
                { name: 'Takiab Beach Cam', url: '#' },
              ].map((cam, idx) => (
                <div key={idx} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ background: '#e0e0e0', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    📹 {cam.name}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 8px 0' }}>{cam.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: '0' }}>Live feed available</p>
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
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #0066cc' }}>
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 8px 0' }}>Current</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0066cc', margin: '0' }}>{tideData.currentTide}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '8px 0 0 0' }}>{tideData.tideHeight.toFixed(1)}m</p>
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 8px 0' }}>High Tide</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#666', margin: '0' }}>13:00</p>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '8px 0 0 0' }}>2.0m</p>
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 8px 0' }}>Low Tide</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#666', margin: '0' }}>06:45</p>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '8px 0 0 0' }}>0.3m</p>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.6', margin: '0' }}>Hua Hin has semi-diurnal tides with significant tidal range. High tides can exceed 2 meters. Plan water activities accordingly.</p>
            </div>
          </div>
        )}

        {/* GUIDES */}
        {currentPage === 'guides' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 30px 0' }}>🗺️ Area Guides</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Decathlon Beach', desc: 'Popular water sports beach with calm waters.' },
                { title: 'Night Bazaar', desc: 'Weekend night market with food and crafts.' },
                { title: 'Petchkasem Road', desc: 'Main coastal highway with shops and views.' },
                { title: 'Takiab Beach', desc: 'Quieter northern beach with viewpoint.' },
                { title: 'Cicada Market', desc: 'Weekend night market entertainment.' },
                { title: 'Railway Station', desc: 'Historic station with nearby shops.' },
              ].map((guide, idx) => (
                <div key={idx} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 10px 0' }}>{guide.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>{guide.desc}</p>
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
                <div key={idx} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 15px 0' }}>{section.title}</h3>
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ padding: '8px 0', borderBottom: i < section.items.length - 1 ? '1px solid #eee' : 'none', color: '#1a1a1a' }}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid #e0e0e0', padding: '25px 20px', textAlign: 'center', color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>
        <p style={{ margin: '0 0 8px 0' }}>© 2026 HuaHinWatch</p>
        <p style={{ margin: '0' }}>Community-powered outage reports</p>
      </footer>
    </div>
  );
};

export default HuaHinWatch;
