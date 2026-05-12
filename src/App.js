import React, { useState, useEffect } from 'react';
import { Home, Zap, MessageSquare, BookOpen, Plane } from 'lucide-react';

const HuaHinWatch = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [weatherData, setWeatherData] = useState(null);
  const [outageReports, setOutageReports] = useState([]);
  const [newReport, setNewReport] = useState({ area: '', description: '' });
  const [time, setTime] = useState(new Date());

  // Hua Hin areas with coordinates for heatmap
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

  // Load reports from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('huahin_outage_reports');
    if (saved) setOutageReports(JSON.parse(saved));
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather data
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

  return (
    <div style={{ background: '#0f172a', color: '#f1f5f9', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderBottom: '2px solid #3b82f6', padding: '20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 5px 0', background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HUA HIN WATCH</h1>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0' }}>Community-powered power outage reports • {formatTime(time)} ICT</p>
            </div>
            {weatherData && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '3rem', marginBottom: '5px' }}>{weatherData.icon}</div>
                <p style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0' }}>{weatherData.temp}°C</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0' }}>{weatherData.condition}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { key: 'home', label: 'Home', icon: Home },
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
                  background: currentPage === nav.key ? '#3b82f6' : 'transparent',
                  border: currentPage === nav.key ? '2px solid #60a5fa' : '2px solid #475569',
                  color: currentPage === nav.key ? '#fff' : '#cbd5e1',
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

      {/* Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Weather */}
            {weatherData && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '25px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>☀️ Hua Hin Weather</h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0' }}>Temperature</p><p style={{ fontSize: '2rem', fontWeight: '900', margin: '0', color: '#60a5fa' }}>{weatherData.temp}°C</p></div>
                  <div><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0' }}>Feels like</p><p style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0' }}>{weatherData.feelsLike}°C</p></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Humidity</p><p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>{weatherData.humidity}%</p></div>
                    <div><p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Wind</p><p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0' }}>{weatherData.windSpeed} km/h</p></div>
                  </div>
                  <div><p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Today</p><p style={{ fontSize: '1rem', fontWeight: '700', margin: '0' }}>High {weatherData.tempMax}° | Low {weatherData.tempMin}° | {weatherData.rainChance}% rain</p></div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '25px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>⚡ Power Status</h2>
              <p style={{ color: '#94a3b8', margin: '0 0 15px 0' }}>Community reports on power outages in Hua Hin</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {outageReports.length > 0 ? (
                  <>
                    <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', margin: '0' }}>🔴 {outageReports.length} active reports</p>
                    <button onClick={() => setCurrentPage('power')} style={{ padding: '10px 15px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>View Map →</button>
                  </>
                ) : (
                  <p style={{ fontSize: '1rem', color: '#10b981', fontWeight: '600', margin: '0' }}>✓ No outages reported</p>
                )}
              </div>
            </div>

            {/* Popular Areas */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '25px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 15px 0' }}>🗺️ Popular Areas</h2>
              <div style={{ display: 'grid', gap: '8px' }}>
                {['Decathlon Beach', 'Night Bazaar', 'Petchkasem Rd', 'Takiab Beach', 'City Center'].map(area => (
                  <button key={area} onClick={() => setCurrentPage('guides')} style={{ padding: '10px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.1)'} onMouseOut={(e) => e.target.style.background = 'transparent'}>
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POWER STATUS PAGE */}
        {currentPage === 'power' && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '25px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 20px 0' }}>⚡ Power Status Map</h2>
            
            {/* Status Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '8px' }}><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 5px 0' }}>Normal</p><p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', margin: '0' }}>{huaHinAreas.filter(a => a.status === 'normal').length}</p></div>
              <div style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.1)', border: '2px solid #f59e0b', borderRadius: '8px' }}><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 5px 0' }}>Warning</p><p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b', margin: '0' }}>{huaHinAreas.filter(a => a.status === 'warning').length}</p></div>
              <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', borderRadius: '8px' }}><p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 5px 0' }}>Outage</p><p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', margin: '0' }}>{huaHinAreas.filter(a => a.status === 'critical').length}</p></div>
            </div>

            {/* Area Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
              {huaHinAreas.map(area => (
                <div key={area.id} style={{ padding: '15px', background: `rgba(${getStatusColor(area.status).includes('#10b981') ? '16, 185, 129' : getStatusColor(area.status).includes('#f59e0b') ? '245, 158, 11' : '239, 68, 68'}, 0.1)`, border: `2px solid ${getStatusColor(area.status)}`, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <p style={{ fontWeight: '700', margin: '0 0 5px 0' }}>{area.name}</p>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0' }}>📍 {area.lat.toFixed(3)}, {area.lng.toFixed(3)}</p>
                    </div>
                    <span style={{ padding: '4px 10px', background: getStatusColor(area.status), color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{getStatusLabel(area.status)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Reports */}
            {outageReports.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 15px 0' }}>📢 Recent Reports</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {outageReports.slice(0, 5).map(report => (
                    <div key={report.id} style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <p style={{ fontWeight: '700', margin: '0' }}>🔴 {report.area}</p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0' }}>{new Date(report.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {report.description && <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0' }}>{report.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORT PAGE */}
        {currentPage === 'report' && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '25px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 20px 0' }}>📢 Report Power Outage</h2>
              <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Help the community by reporting power outages in Hua Hin</p>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>Area *</label>
                  <select value={newReport.area} onChange={(e) => setNewReport({ ...newReport, area: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1e293b', border: '2px solid #475569', color: '#f1f5f9', borderRadius: '6px', fontSize: '1rem' }}>
                    <option value="">Select area...</option>
                    {huaHinAreas.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#cbd5e1' }}>Description (optional)</label>
                  <textarea value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="When did it start? Any details?" style={{ width: '100%', padding: '12px', background: '#1e293b', border: '2px solid #475569', color: '#f1f5f9', borderRadius: '6px', fontSize: '1rem', minHeight: '100px', fontFamily: 'inherit' }} />
                </div>

                <button onClick={handleReportSubmit} style={{ padding: '12px 20px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>
                  Submit Report
                </button>
              </div>

              {outageReports.length > 0 && (
                <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '2px solid #475569' }}>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>📊 {outageReports.length} total reports this month</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GUIDES PAGE */}
        {currentPage === 'guides' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              { title: 'Decathlon Beach', desc: 'Popular water sports beach with calm waters and easy access from town.' },
              { title: 'Night Bazaar', desc: 'Weekend night market with street food, crafts and local atmosphere.' },
              { title: 'Petchkasem Road', desc: 'Main coastal highway with shops, restaurants and viewpoints.' },
              { title: 'Takiab Beach', desc: 'Quieter northern beach with scenic viewpoint and local cafes.' },
              { title: 'Cicada Market', desc: 'Popular night market (weekends) featuring local food and crafts.' },
              { title: 'Railway Station Area', desc: 'Historic station with nearby hotels, shops and local restaurants.' },
            ].map((guide, idx) => (
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 10px 0' }}>{guide.title}</h3>
                <p style={{ color: '#cbd5e1', margin: '0', lineHeight: '1.6' }}>{guide.desc}</p>
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
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid #475569', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 15px 0' }}>{section.icon} {section.title}</h3>
                <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ padding: '8px 0', borderBottom: i < section.items.length - 1 ? '1px solid #475569' : 'none', color: '#cbd5e1' }}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '2px solid #475569', padding: '25px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '40px' }}>
        <p style={{ margin: '0 0 10px 0' }}>© 2026 HuaHinWatch • Community-powered outage reports</p>
        <p style={{ margin: '0' }}>Not affiliated with PEA. Reports are user-submitted and unverified. Use at your own risk.</p>
      </footer>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default HuaHinWatch;
