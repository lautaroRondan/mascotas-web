import { num } from '../../utils.js'

// ATENCIÓN: se asume 0 = lunes (como weekday() de Python). Verificá cómo lo interpreta tu backend.
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const PRESENTATIONS = { comprimido: 'Comprimido', jarabe: 'Jarabe', gotas: 'Gotas' }
export const DOSE_UNIT_FOR = { comprimido: 'comprimido', jarabe: 'ml', gotas: 'gotas' }
// Concentración: mg por comprimido (comprimidos) o mg por ml (líquidos)
export const CONC_PER = { comprimido: 'comprimido', jarabe: 'ml', gotas: 'ml' }
const UNITS = ['comprimido', 'ml', 'gotas']

export const scheduleInitial = (presentation = 'comprimido') => ({
  recurrence: 'daily', intervalDays: '2', daysOfWeek: [], times: ['08:00'],
  doseAmount: '1', doseUnit: DOSE_UNIT_FOR[presentation] ?? 'comprimido', doseNote: '', concAmount: '',
})

export const scheduleFromOut = (s) => ({
  recurrence: s.recurrence_type,
  intervalDays: String(s.interval_days ?? 2),
  daysOfWeek: s.days_of_week ?? [],
  times: s.times.map((t) => t.slice(0, 5)),
  doseAmount: String(parseFloat(s.dose_amount)),
  doseUnit: s.dose_unit,
  doseNote: s.dose_note ?? '',
  concAmount: s.concentration_amount ? String(parseFloat(s.concentration_amount)) : '',
})

export const schedulePayload = (f) => ({
  recurrence_type: f.recurrence,
  times: [...new Set(f.times.filter(Boolean))].sort(),
  dose_amount: Number(f.doseAmount),
  dose_unit: f.doseUnit,
  dose_note: f.doseNote || null,
  concentration_amount: f.concAmount ? Number(f.concAmount) : null,
  concentration_unit: f.concAmount ? 'mg' : null,
  interval_days: f.recurrence === 'every_n_days' ? Number(f.intervalDays) : null,
  days_of_week: f.recurrence === 'weekdays' ? f.daysOfWeek : null,
})

export function scheduleError(f) {
  if (f.recurrence === 'weekdays' && f.daysOfWeek.length === 0) return 'Elegí al menos un día de la semana.'
  if (!f.times.some(Boolean)) return 'Agregá al menos un horario.'
  return ''
}

export default function ScheduleFields({ f, setF, presentation }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggleDay = (i) =>
    setF({ ...f, daysOfWeek: f.daysOfWeek.includes(i) ? f.daysOfWeek.filter((d) => d !== i) : [...f.daysOfWeek, i].sort() })
  const setTime = (i, v) => setF({ ...f, times: f.times.map((t, j) => (j === i ? v : t)) })

  // Solo informativo; la app no sugiere dosis. Con gotas no se muestra (depende del cálculo del backend).
  const mgPerDose = f.concAmount && f.doseAmount && f.doseUnit !== 'gotas'
    ? num(Number(f.doseAmount) * Number(f.concAmount)) : null

  return (
    <>
      <label>Concentración (mg por {CONC_PER[presentation] ?? 'unidad'})
        <input type="number" step="any" min="0" value={f.concAmount} onChange={set('concAmount')} placeholder="Ej: 75" />
      </label>
      <label>Cantidad por toma<input type="number" step="any" min="0" required value={f.doseAmount} onChange={set('doseAmount')} /></label>
      <label>Unidad de la dosis<select value={f.doseUnit} onChange={set('doseUnit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
      <label>Nota de la dosis<input value={f.doseNote} onChange={set('doseNote')} placeholder="Ej: con comida" /></label>
      {mgPerDose && <p className="muted" style={{ gridColumn: '1 / -1' }}>Cada toma: {mgPerDose} mg</p>}

      <label>Frecuencia
        <select value={f.recurrence} onChange={set('recurrence')}>
          <option value="daily">Todos los días</option>
          <option value="every_n_days">Cada X días</option>
          <option value="weekdays">Días de la semana</option>
        </select>
      </label>
      {f.recurrence === 'every_n_days' && (
        <label>Cada cuántos días<input type="number" min="2" max="365" required value={f.intervalDays} onChange={set('intervalDays')} /></label>
      )}
      {f.recurrence === 'weekdays' && (
        <fieldset className="days">
          <legend>Días</legend>
          {DAYS.map((d, i) => (
            <label key={d} className="inline">
              <input type="checkbox" checked={f.daysOfWeek.includes(i)} onChange={() => toggleDay(i)} /> {d}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="days" style={{ gridColumn: '1 / -1' }}>
        <legend>Horarios</legend>
        {f.times.map((t, i) => (
          <span key={i} className="inline">
            <input type="time" required value={t} onChange={(e) => setTime(i, e.target.value)} />
            {f.times.length > 1 && (
              <button type="button" className="ghost" onClick={() => setF({ ...f, times: f.times.filter((_, j) => j !== i) })}>Quitar</button>
            )}
          </span>
        ))}
        <button type="button" className="ghost" onClick={() => setF({ ...f, times: [...f.times, '20:00'] })}>Agregar horario</button>
      </fieldset>
    </>
  )
}