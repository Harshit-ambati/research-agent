import React, { useState } from 'react';
import { CloudSun, Droplets, MapPin, Navigation, Wind } from 'lucide-react';

export default function WeatherCard({ weather, isLoading, onSearchCity, onUseLocation, onClose }) {
  const [city, setCity] = useState('');
  const needsLocation = !weather || weather.needs_location;

  const submitCity = (event) => {
    event.preventDefault();
    if (city.trim()) onSearchCity(city.trim());
  };

  return (
    <section className="max-w-4xl mx-auto px-4 mb-5">
      <div className="glass-panel border border-cyan-500/30 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-400/30 grid place-items-center text-cyan-300">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white">Live Weather</h2>
              <p className="text-xs text-slate-400">Current conditions via Open-Meteo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none" title="Dismiss weather">x</button>
        </div>

        {needsLocation ? (
          <div className="mt-5">
            <p className="text-sm text-slate-300">
              {weather?.location_not_found ? 'That location could not be found. Try a city or region.' : 'Choose a location to retrieve a live forecast.'}
            </p>
            <form onSubmit={submitCity} className="mt-4 flex flex-col sm:flex-row gap-2">
              <label className="sr-only" htmlFor="weather-city">City or region</label>
              <input id="weather-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or region" className="min-w-0 flex-1 rounded-md border border-slate-600 bg-dark-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" />
              <button type="submit" disabled={isLoading || !city.trim()} className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Search weather</button>
              <button type="button" onClick={onUseLocation} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400 disabled:opacity-50"><Navigation className="w-4 h-4" />Use my location</button>
            </form>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1 text-sm text-cyan-300"><MapPin className="w-4 h-4" />{weather.location}</span>
              <span className="text-sm text-slate-300">{weather.condition}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric label="Temperature" value={`${weather.temperature_c ?? '-'} C`} />
              <Metric label="Feels like" value={`${weather.feels_like_c ?? '-'} C`} />
              <Metric label="Humidity" value={`${weather.humidity_percent ?? '-'}%`} icon={<Droplets className="w-3.5 h-3.5" />} />
              <Metric label="Wind" value={`${weather.wind_kmh ?? '-'} km/h`} icon={<Wind className="w-3.5 h-3.5" />} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, icon }) {
  return <div className="rounded-md border border-slate-700 bg-dark-900/70 p-3"><p className="flex items-center gap-1 text-xs text-slate-400">{icon}{label}</p><p className="mt-1 text-base font-semibold text-white">{value}</p></div>;
}
