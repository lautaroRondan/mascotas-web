import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { fmtDate, daysUntil, money } from '../../utils.js'
import VisitForm from './VisitForm.jsx'
import { perms } from '../../utils.js'

const sort = (v) => [...v].sort((a, b) => b.visited_on.localeCompare(a.visited_on))

export default function VisitsTab({ petId, role }) {
  const canWrite = perms(role).write
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listVisits(petId).then((v) => setItems(sort(v))).catch((e) => setError(e.message))
  }, [petId])

  const create = async (payload) => {
    const v = await api.createVisit(petId, payload)
    setItems(sort([...items, v])); setAdding(false)
  }
  const update = async (payload) => {
    const v = await api.updateVisit(editingId, payload)
    setItems(sort(items.map((x) => (x.id === v.id ? v : x)))); setEditingId(null)
  }
  const remove = async (v) => {
    if (!confirm('¿Eliminar esta visita?')) return
    try { await api.deleteVisit(v.id); setItems(items.filter((x) => x.id !== v.id)) }
    catch (er) { setError(er.message) }
  }

  return (
    <>
      <div className="row">
        <span className="spacer" />
        {canWrite && !adding && <button onClick={() => setAdding(true)}>Agregar visita</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {adding && <VisitForm submitLabel="Guardar visita" onSubmit={create} onCancel={() => setAdding(false)} />}
      {items.length === 0 && !adding && <p className="muted">Todavía no hay visitas registradas.</p>}
      <ul className="pets">
        {items.map((v) =>
          v.id === editingId ? (
            <li key={v.id}>
              <VisitForm visit={v} submitLabel="Guardar cambios" onSubmit={update} onCancel={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={v.id} className="card item">
              <div>
                <strong>{v.reason}</strong> <span className="muted">{fmtDate(v.visited_on)}</span>
                {v.notes && <div>{v.notes}</div>}
                {v.cost != null && <div className="muted">{money(v.cost)}</div>}
                {v.next_visit_on && daysUntil(v.next_visit_on) >= 0 && (
                  <span className="badge">Próxima visita: {fmtDate(v.next_visit_on)}</span>
                )}
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