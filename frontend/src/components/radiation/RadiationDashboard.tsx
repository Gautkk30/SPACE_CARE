
import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Satellite,
  Zap,
} from 'lucide-react';

import {
  radiationService,
  type CmeEventsResponse,
} from '../../services/radiationService';

function getLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function RadiationDashboard() {
  const today = new Date();
  const previousDate = new Date();
  previousDate.setDate(today.getDate() - 14);

  const [startDate, setStartDate] = useState(
    getLocalDate(previousDate)
  );
  const [endDate, setEndDate] = useState(
    getLocalDate(today)
  );

  const [data, setData] = useState<CmeEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadEvents() {
    if (startDate > endDate) {
      setError('Start date cannot be later than end date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await radiationService.getCmeEvents(
        startDate,
        endDate
      );

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load NASA CME events.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
    // Load the initial date range once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Satellite className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              Space Radiation & Solar Activity
            </h2>
            <p className="text-sm text-slate-400">
              NASA CCMC DONKI · Coronal Mass Ejection events
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          Monitor NASA-reported solar activity and CME events
          to understand the space-weather environment around
          space missions.
        </p>
      </section>

      {/* Date Filter */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">
          Search NASA Events
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-xs text-slate-400">
            Start Date
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
            />
          </label>

          <label className="text-xs text-slate-400">
            End Date
            <input
              type="date"
              value={endDate}
              max={getLocalDate(new Date())}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
            />
          </label>

          <div className="flex items-end">
            <button
              onClick={loadEvents}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg p-3 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching NASA Data...' : 'Fetch NASA Events'}
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="text-center p-10 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3" />
          Connecting to NASA DONKI...
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Activity className="w-5 h-5 text-amber-400" />
                NASA CME Events Found
              </div>

              <p className="text-3xl font-bold text-white mt-3">
                {data.count}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Events in selected date range
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Zap className="w-5 h-5 text-sky-400" />
                Data Provider
              </div>

              <p className="text-lg font-bold text-white mt-3">
                {data.source}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                NASA space-weather event information
              </p>
            </div>
          </section>

          {/* Scientific Notice */}
          <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h3 className="text-amber-300 font-semibold text-sm mb-2">
              Scientific Notice
            </h3>
            <p className="text-amber-100/70 text-xs leading-relaxed">
              {data.scientific_notice}
            </p>
            <p className="text-amber-100/70 text-xs leading-relaxed mt-2">
              CME speed is not an astronaut radiation-dose measurement.
              Individual exposure requires appropriate radiation
              monitoring and dosimeter data.
            </p>
          </section>

          {/* Event List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Solar Event Records
              </h3>
              <span className="text-xs text-slate-500">
                {data.count} records
              </span>
            </div>

            {data.events.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                No CME events found for this date range.
              </div>
            ) : (
              data.events.map((event, index) => (
                <article
                  key={event.event_id || index}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/30 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-amber-400 font-semibold">
                        CORONAL MASS EJECTION
                      </span>

                      <h4 className="text-white font-semibold mt-1">
                        {event.event_id || `CME Event ${index + 1}`}
                      </h4>

                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(event.start_time)}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
                      <p className="text-xs text-slate-500">
                        Reported CME Speed
                      </p>
                      <p className="text-xl font-bold text-amber-300">
                        {event.speed_km_s != null
                          ? `${event.speed_km_s} km/s`
                          : 'Not available'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="text-slate-400">
                      <span className="text-slate-500">Source Location: </span>
                      {event.source_location || 'Not reported'}
                    </div>

                    <div className="text-slate-400">
                      <span className="text-slate-500">CME Type: </span>
                      {event.type || 'Not available'}
                    </div>

                    <div className="text-slate-400">
                      <span className="text-slate-500">Half Angle: </span>
                      {event.half_angle != null
                        ? `${event.half_angle}°`
                        : 'Not available'}
                    </div>
                  </div>

                  {event.note && (
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      {event.note}
                    </p>
                  )}

                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-xs text-sky-400 hover:text-sky-300"
                    >
                      View NASA Source
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
