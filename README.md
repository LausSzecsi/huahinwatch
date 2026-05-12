# HuaHinWatch 🏖️

Real-time information dashboard for Hua Hin, Thailand. Live cameras, weather data, traffic conditions, and power outage status - all in one place.

## Features

- **📹 Live Cameras** - Real-time ITAC webcam feeds from key locations
- **☀️ Weather** - Current conditions, forecasts, and rain radar (powered by Open-Meteo)
- **🚗 Traffic** - Real-time traffic conditions on main routes
- **⚡ Power Status** - PEA power outage alerts and restoration times
- **🔔 Notifications** - Push alerts for important updates

## Tech Stack

- **Frontend**: React 18 + Lucide Icons
- **Weather Data**: Open-Meteo API (free, no API key required)
- **Camera Feeds**: ITAC Hua Hin City
- **Hosting**: Vercel

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
git clone https://github.com/LausSzecsi/huahinwatch
cd huahinwatch
npm install
```

### Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Environment Variables

No API keys required! The app uses:
- Open-Meteo (free, public API)
- ITAC public camera feeds
- PEA public data

## Deployment

This project is configured for Vercel:

1. Push to GitHub
2. Connect GitHub repo to Vercel
3. Deploy!

## Data Sources

- **Weather**: Open-Meteo (free, real-time)
- **Cameras**: ITAC Hua Hin City (traffic.itac-huahincity.com)
- **Power Outages**: PEA (Provincial Electricity Authority)
- **Traffic**: Community data + Google Maps

## Contributing

Pull requests welcome! Please feel free to submit issues or suggestions.

## License

MIT License - feel free to use and modify

## Contact

Questions? Issues? Reach out!

---

**HuaHinWatch v4.0** - Built for Hua Hin locals and tourists 🌴
