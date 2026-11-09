import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { fmtDate, daysUntil } from '../../utils.js'
import VaccineForm from './VaccineForm.jsx'
import { perms } from '../../utils.js'

const sort = (v) => [...v].sort((a, b) => b.applied_on.localeCompare(a.applied_on))

function dueBadge(date) {
  if (!date) return null
  const d = daysUntil(date)
  if (d < 0) return <span className="badge danger">Vencida el {fmtDate(date)}</span>
  if (d <= 30) return <span className="badge warn">Refuerzo en {d} {d === 1 ? 'día' : 'días'} ({fmtDate(date)})</span>
  return <span className="badge">Próximo refuerzo: {fmtDate(date)}</span>
}

export default function VaccinesTab({ petId, role }) {
  const canWrite = perms(role).write
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listVaccines(petId).then((v) => setItems(sort(v))).catch((e) => setError(e.message))
  }, [petId])

  const create = async (payload) => {
    const v = await api.createVaccine(petId, payload)
    setItems(sort([...items, v])); setAdding(false)
  }
  const update = async (payload) => {
    const v = await api.updateVaccine(editingId, payload)
    setItems(sort(items.map((x) => (x.id === v.id ? v : x)))); setEditingId(null)
  }
  const remove = async (v) => {
    if (!confirm(`¿Eliminar la vacuna ${v.name}?`)) return
    try { await api.deleteVaccine(v.id); setItems(items.filter((x) => x.id !== v.id)) }
    catch (er) { setError(er.message) }
  }

  return (
    <>
      <div className="row">
        <span className="spacer" />
        {canWrite && !adding && <button onClick={() => setAdding(true)}>Agregar Vacuna</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {adding && <VaccineForm submitLabel="Guardar vacuna" onSubmit={create} onCancel={() => setAdding(false)} />}
      {items.length === 0 && !adding && <p className="muted">Todavía no hay vacunas registradas.</p>}
      <ul className="pets">
        {items.map((v) =>
          v.id === editingId ? (
            <li key={v.id}>
              <VaccineForm vaccine={v} submitLabel="Guardar cambios" onSubmit={update} onCancel={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={v.id} className="card item">
              <div>
                <strong>{v.name}</strong> <span className="muted">aplicada el {fmtDate(v.applied_on)}</span>
                {v.notes && <div>{v.notes}</div>}
                {dueBadge(v.next_due_on)}
              </div>
              {canWrite && <button className="ghost" onClick={() => setEditingId(v.id)}>Editar</button>}
              {canWrite && <button className="ghost" onClick={() => remove(v)}>Eliminar</button>}
            </li>
          )
        )}
      </ul>
    </>
  )
}