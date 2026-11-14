import { useState, type FormEvent } from 'react';
import { HeartPulse, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HealthFormData {
  astronaut_id: string;
  heart_rate: string;
  spo2: string;
  systolic_bp: string;
  diastolic_bp: string;
  body_temperature: string;
  respiration_rate: string;
  hrv_rmssd: string;
}

const initialForm: HealthFormData = {
  astronaut_id: '',
  heart_rate: '',
  spo2: '',
  systolic_bp: '',
  diastolic_bp: '',
  body_temperature: '',
  respiration_rate: '',
  hrv_rmssd: '',
};

const fields: {
  name: keyof Omit<HealthFormData, 'astronaut_id'>;
  label: string;
  unit: string;
  placeholder: string;
}[] = [
  { name: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
  { name: 'spo2', label: 'Blood Oxygen (SpO₂)', unit: '%', placeholder: '98' },
  { name: 'systolic_bp', label: 'Systolic Blood Pressure', unit: 'mmHg', placeholder: '120' },
  { name: 'diastolic_bp', label: 'Diastolic Blood Pressure', unit: 'mmHg', placeholder: '80' },
  { name: 'body_temperature', label: 'Body Temperature', unit: '°C', placeholder: '37' },
  { name: 'respiration_rate', label: 'Respiration Rate', unit: 'breaths/min', placeholder: '16' },
  { name: 'hrv_rmssd', label: 'HRV (RMSSD)', unit: 'ms', placeholder: '45' },
];

export function ManualHealthForm() {
  const [form, setForm] = useState<HealthFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (name: keyof HealthFormData, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setResponse(null);
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResponse(null);
    setError('');

    const payload = {
      astronaut_id: form.astronaut_id.trim(),
      heart_rate: Number(form.heart_rate),
      spo2: Number(form.spo2),
      systolic_bp: Number(form.systolic_bp),
      diastolic_bp: Number(form.diastolic_bp),
      body_temperature: Number(form.body_temperature),
      respiration_rate: Number(form.respiration_rate),
      hrv_rmssd: Number(form.hrv_rmssd),
    };

    try {
      const result = await fetch('http://127.0.0.1:8000/api/v1/vitals/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await result.json();

      if (!result.ok) {
        const details = Array.isArray(data.detail)
          ? data.detail.map((item: { loc?: string[]; msg?: string }) =>
              `${item.loc?.slice(1).join('.') || 'Input'}: ${item.msg || 'Invalid value'}`
            ).join('; ')
          : data.detail || 'Unable to submit readings.';
        throw new Error(details);
      }

      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the SPACECARE backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Manual Health Input</h2>
            <p className="text-sm text-slate-400">Enter astronaut physiological readings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <label htmlFor="astronaut_id" className="block text-sm text-slate-300 mb-2">
              Astronaut ID
            </label>
            <input
              id="astronaut_id"
              required
              maxLength={50}
              value={form.astronaut_id}
              onChange={(e) => handleChange('astronaut_id', e.target.value)}
              placeholder="e.g. ASTRO-001"
              className={inputClass}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
              Physiological Readings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm text-slate-300 mb-2">
                    {field.label} <span className="text-slate-500">({field.unit})</span>
                  </label>
                  <input
                    id={field.name}
                    type="number"
                    required
                    step="any"
                    value={form[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg py-3 transition"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Health Readings'}
          </button>
        </form>
      </section>

      {error && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {response && (
        <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
            <CheckCircle2 className="w-5 h-5" />
            Readings accepted by backend
          </div>
          <p className="text-sm text-slate-300">
            Astronaut ID: {response.astronaut_id}
          </p>
          <p className="text-sm text-slate-300 mt-1">
            Recorded at: {response.recorded_at}
          </p>
          <p className="text-sm text-amber-300 mt-3">
            {response.assessment?.message}
          </p>
        </section>
      )}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200/80 leading-relaxed">
        <strong>Scientific disclaimer:</strong> This prototype validates submitted input only.
        It does not perform clinical assessment, diagnose medical conditions, or generate
        ML predictions. Submitted readings are not permanently stored yet.
      </div>
    </div>
  );
}
