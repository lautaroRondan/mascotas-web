import { useState } from 'react'
import { todayISO } from '../../utils.js'

const toForm = (v) => v
  ? { visitedOn: v.visited_on, reason: v.reason, notes: v.notes ?? '', cost: v.cost != null ? String(parseFloat(v.cost)) : '', nextVisitOn: v.next_visit_on ?? '' }
  : { visitedOn: todayISO(), reason: '', notes: '', cost: '', nextVisitOn: '' }

export default function VisitForm({ visit, submitLabel, onSubmit, onCancel }) {
  const [f, setF] = useState(toForm(visit))
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try {
      await onSubmit({
        visited_on: f.visitedOn,
        reason: f.reason.trim(),
        notes: f.notes || null,
        cost: f.cost === '' ? null : Number(f.cost),
        next_visit_on: f.nextVisitOn || null,
      })
    } catch (er) { setError(er.message) }
  }

  return (
    <form className="card grid" onSubmit={submit}>
      <label>Fecha<input type="date" required value={f.visitedOn} onChange={set('visitedOn')} /></label>
      <label>Motivo<input required value={f.reason} onChange={set('reason')} placeholder="Ej: control anual" /></label>
      <label>Costo<input type="number" min="0" step="any" value={f.cost} onChange={set('cost')} /></label>
      <label>Próxima visita<input type="date" value={f.nextVisitOn} onChange={set('nextVisitOn')} /></label>
      <label style={{ gridColumn: '1 / -1' }}>Notas<input value={f.notes} onChange={set('notes')} /></label>
      {error && <p className="error" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
      <div className="row end">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}