import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { fmtDate, num } from '../../utils.js'
import { DAYS, PRESENTATIONS, CONC_PER } from './ScheduleFields.jsx'
import ScheduleChangeForm from './ScheduleChangeForm.jsx'
import { fmtDate, num, perms } from '../../utils.js'

const STATUS = { active: 'Activo', paused: 'Pausado', finished: 'Finalizado' }
const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '')

function freqText(s) {
  if (s.recurrence_type === 'daily') return 'Todos los días'
  if (s.recurrence_type === 'every_n_days') return `Cada ${s.interval_days} días`
  return (s.days_of_week ?? []).map((i) => DAYS[i]).join(', ')
}

export default function MedCard({ med, onChange, role }) {
  const { write: canWrite, owner: isOwner } = perms(role)
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  // El tramo vigente es el que no tiene fecha de cierre
  const cur = med.schedules?.find((s) => !s.valid_to) ?? med.schedules?.at(-1)
  const loadSlots = () => api.daySlots(med.id).then(setSlots).catch((e) => setError(e.message))

  useEffect(() => { if (med.status === 'active') loadSlots(); else setSlots([]) }, [med.id, med.status])

  const register = async (slot, status) => {
    setError('')
    try {
      const log = await api.registerDose(med.id, { scheduled_at: slot.scheduled_at, status })
      setSlots(slots.map((x) => (x.scheduled_at === slot.scheduled_at ? { ...x, log } : x)))
    } catch (e) { setError(e.message); loadSlots() } // si ya estaba registrada, recargar
  }

  const setStatus = async (status) => {
    if (status === 'finished' && !confirm(`¿Finalizar ${med.name}? Pasa al historial.`)) return
    try { onChange(await api.updateMed(med.id, { status })) }
    catch (e) { setError(e.message) }
  }

  const changed = (m) => { onChange(m); setEditing(false); loadSlots() }

  const conc = cur?.concentration_amount
    ? `${num(cur.concentration_amount)} mg por ${CONC_PER[med.presentation] ?? 'unidad'}` : null

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: '.25rem' }}>
        <strong>{med.name}</strong>
        <span className={`badge ${med.status === 'paused' ? 'warn' : ''}`}>{STATUS[med.status] ?? med.status}</span>
        <span className="spacer" />
        {canWrite && med.status !== 'finished' && !editing && <button className="ghost" onClick={() => setEditing(true)}>Cambiar dosis</button>}
        {canWrite && med.status === 'active' && <button className="ghost" onClick={() => setStatus('paused')}>Pausar</button>}
        {canWrite && med.status === 'paused' && <button className="ghost" onClick={() => setStatus('active')}>Reanudar</button>}
        {isOwner && med.status !== 'finished' && <button className="ghost" onClick={() => setStatus('finished')}>Finalizar</button>}
      </div>

      {cur && (
        <>
          <p className="muted">
            {num(cur.dose_amount)} {cur.dose_unit}
            {cur.mg_per_dose ? ` = ${num(cur.mg_per_dose)} mg` : ''}
            {cur.dose_note ? ` (${cur.dose_note})` : ''} · {freqText(cur)} · {cur.times.map((t) => t.slice(0, 5)).join(' y ')}
          </p>
          <p className="muted">
            {[PRESENTATIONS[med.presentation], conc].filter(Boolean).join(' · ') || 'Sin presentación ni concentración cargadas'}
          </p>
        </>
      )}
      <p className="muted">
        {med.is_chronic ? `Crónico, desde el ${fmtDate(med.start_date)}` : `Del ${fmtDate(med.start_date)} al ${fmtDate(med.end_date)}`}
      </p>
      {med.notes && <p>{med.notes}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {editing && cur && (
        <div style={{ marginTop: '.75rem' }}>
          <ScheduleChangeForm med={med} current={cur} onDone={changed} onCancel={() => setEditing(false)} />
        </div>
      )}

      {med.status === 'active' && (
        <div className="slots">
          <strong>Hoy</strong>
          {slots.length === 0 && <p className="muted">Hoy no toca ninguna toma.</p>}
          {slots.map((sl) => (
            <div key={sl.scheduled_at} className="slot">
              <span>
                <strong>{hhmm(sl.scheduled_at)}</strong> {num(sl.dose_amount)} {sl.dose_unit}
                {sl.mg_per_dose ? ` (${num(sl.mg_per_dose)} mg)` : ''}
              </span>
              {sl.log ? (
                <span className={`badge ${sl.log.status === 'skipped' ? 'warn' : ''}`}>
                  {sl.log.status === 'given'
                    ? `Dada por ${sl.log.given_by_name ?? '—'} a las ${hhmm(sl.log.given_at)}`
                    : 'Salteada'}
                </span>
              ) : (
                <span className="inline">
                  <button onClick={() => register(sl, 'given')}>Ya se la di</button>
                  <button className="ghost" onClick={() => register(sl, 'skipped')}>Saltear</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}