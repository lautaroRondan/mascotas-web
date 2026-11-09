import { useState } from 'react'
import { todayISO } from '../../utils.js'

const toForm = (v) => v
  ? { name: v.name, appliedOn: v.applied_on, nextDueOn: v.next_due_on ?? '', notes: v.notes ?? '' }
  : { name: '', appliedOn: todayISO(), nextDueOn: '', notes: '' }

export default function VaccineForm({ vaccine, submitLabel, onSubmit, onCancel }) {
  const [f, setF] = useState(toForm(vaccine))
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try {
      await onSubmit({
        name: f.name.trim(),
        applied_on: f.appliedOn,
        next_due_on: f.nextDueOn || null,
        notes: f.notes || null,
      })
    } catch (er) { setError(er.message) }
  }

  return (
    <form className="card grid" onSubmit={submit}>
      <label>Vacuna<input required value={f.name} onChange={set('name')} placeholder="Ej: Antirrábica" /></label>
      <label>Fecha de aplicación<input type="date" required value={f.appliedOn} onChange={set('appliedOn')} /></label>
      <label>Próximo refuerzo<input type="date" value={f.nextDueOn} onChange={set('nextDueOn')} /></label>
      <label>Notas<input value={f.notes} onChange={set('notes')} /></label>
      {error && <p className="error" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
      <div className="row end">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}