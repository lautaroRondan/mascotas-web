import { useState } from 'react'
import { api } from '../../api.js'
import { todayISO } from '../../utils.js'
import ScheduleFields, {
  PRESENTATIONS, DOSE_UNIT_FOR, scheduleInitial, schedulePayload, scheduleError,
} from './ScheduleFields.jsx'

const initial = () => ({
  name: '', presentation: 'comprimido', isChronic: false, startDate: todayISO(),
  endDate: '', durationDays: '', notes: '', ...scheduleInitial('comprimido'),
})

export default function MedForm({ petId, known, onCreated, onCancel }) {
  const [f, setF] = useState(initial())
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  // Al elegir la presentación se propone la unidad de dosis habitual (se puede cambiar)
  const setPresentation = (e) => setF({ ...f, presentation: e.target.value, doseUnit: DOSE_UNIT_FOR[e.target.value] })

  const submit = async (e) => {
    e.preventDefault(); setError('')
    const err = scheduleError(f)
    if (err) return setError(err)
    try {
      const med = await api.createMed(petId, {
        name: f.name.trim(),
        presentation: f.presentation,
        is_chronic: f.isChronic,
        start_date: f.startDate,
        end_date: !f.isChronic && f.endDate ? f.endDate : null,
        duration_days: !f.isChronic && !f.endDate && f.durationDays ? Number(f.durationDays) : null,
        notes: f.notes || null,
        schedule: schedulePayload(f),
      })
      onCreated(med)
    } catch (er) { setError(er.message) }
  }

  return (
    <form className="card grid" onSubmit={submit}>
      <label>Medicamento
        <input required list="known-meds" value={f.name} onChange={set('name')} placeholder="Ej: Meloxicam" />
        <datalist id="known-meds">{known.map((n) => <option key={n} value={n} />)}</datalist>
      </label>
      <label>Presentación
        <select value={f.presentation} onChange={setPresentation}>
          {Object.entries(PRESENTATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="inline">
        <input type="checkbox" checked={f.isChronic} onChange={(e) => setF({ ...f, isChronic: e.target.checked })} />
        Crónico (de por vida)
      </label>

      <label>Fecha de inicio<input type="date" required value={f.startDate} onChange={set('startDate')} /></label>
      {!f.isChronic && (
        <>
          <label>Fecha de fin<input type="date" value={f.endDate} onChange={set('endDate')} /></label>
          <label>o durante (días)
            <input type="number" min="1" max="3650" value={f.durationDays} onChange={set('durationDays')} disabled={!!f.endDate} />
          </label>
        </>
      )}

      <ScheduleFields f={f} setF={setF} presentation={f.presentation} />

      <label style={{ gridColumn: '1 / -1' }}>Notas<input value={f.notes} onChange={set('notes')} /></label>
      {error && <p className="error" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
      <div className="row end">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit">Guardar medicación</button>
      </div>
    </form>
  )
}