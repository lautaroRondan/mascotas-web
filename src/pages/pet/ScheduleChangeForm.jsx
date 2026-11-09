import { useState } from 'react'
import { api } from '../../api.js'
import { num } from '../../utils.js'
import ScheduleFields, { PRESENTATIONS, scheduleFromOut, schedulePayload, scheduleError } from './ScheduleFields.jsx'

const concOf = (s) => (s?.concentration_amount ? Number(s.concentration_amount) : null)

export default function ScheduleChangeForm({ med, current, onDone, onCancel }) {
  const [f, setF] = useState({ ...scheduleFromOut(current), validFrom: '', confirm: false, newPresentation: '' })
  const [error, setError] = useState('')

  // Las medicaciones cargadas antes de existir "presentación" no la tienen: se puede completar acá
  const presentation = med.presentation ?? (f.newPresentation || null)
  const newConc = f.concAmount ? Number(f.concAmount) : null
  const concChanged = newConc !== concOf(current)
  const mg = newConc && f.doseUnit !== 'gotas' ? num(Number(f.doseAmount) * newConc) : null

  const submit = async (e) => {
    e.preventDefault(); setError('')
    const err = scheduleError(f)
    if (err) return setError(err)
    try {
      if (!med.presentation && f.newPresentation) await api.updateMed(med.id, { presentation: f.newPresentation })
      const updated = await api.changeSchedule(med.id, {
        ...schedulePayload(f),
        valid_from: f.validFrom || null,
        confirm_dose: concChanged && f.confirm,
      })
      onDone(updated)
    } catch (er) { setError(er.message) }
  }

  return (
    <form className="card grid" onSubmit={submit} style={{ background: '#f7faf9' }}>
      <strong style={{ gridColumn: '1 / -1' }}>Cambiar dosis, concentración u horarios</strong>
      <p className="muted" style={{ gridColumn: '1 / -1' }}>Afecta solo a las tomas futuras; lo anterior queda en el historial.</p>

      {!med.presentation && (
        <label>Presentación
          <select value={f.newPresentation} onChange={(e) => setF({ ...f, newPresentation: e.target.value })}>
            <option value="">Sin definir</option>
            {Object.entries(PRESENTATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      )}
      <label>Desde (vacío = hoy)<input type="date" value={f.validFrom} onChange={(e) => setF({ ...f, validFrom: e.target.value })} /></label>

      <ScheduleFields f={f} setF={setF} presentation={presentation} />

      {concChanged && (
        <div style={{ gridColumn: '1 / -1', background: '#fdf0cf', borderRadius: 8, padding: '.75rem' }}>
          <p style={{ margin: '0 0 .5rem' }}>
            Cambió la concentración. Revisá la dosis por toma con la caja nueva
            {mg ? `: ${num(f.doseAmount)} ${f.doseUnit} = ${mg} mg.` : '.'}
          </p>
          <label className="inline">
            <input type="checkbox" required checked={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.checked })} />
            Confirmo la dosis por toma
          </label>
        </div>
      )}

      {error && <p className="error" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
      <div className="row end">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit">Guardar cambio</button>
      </div>
    </form>
  )
}