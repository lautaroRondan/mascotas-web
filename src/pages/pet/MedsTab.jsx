import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import MedForm from './MedForm.jsx'
import MedCard from './MedCard.jsx'
import { perms } from '../../utils.js'

export default function MedsTab({ petId, role }) {
  const [meds, setMeds] = useState([])
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState('active')
  const [error, setError] = useState('')

  useEffect(() => {
    api.listMeds(petId).then(setMeds).catch((e) => setError(e.message))
  }, [petId])

  // Activos = activos y pausados; Historial = finalizados (no se borran)
  const shown = meds.filter((m) => (view === 'active' ? m.status !== 'finished' : m.status === 'finished'))
  const replace = (m) => setMeds(meds.map((x) => (x.id === m.id ? m : x)))

  return (
    <>
      <div className="row">
        <div className="tabs" style={{ border: 0, margin: 0 }}>
          <button aria-selected={view === 'active'} onClick={() => setView('active')}>Activos</button>
          <button aria-selected={view === 'history'} onClick={() => setView('history')}>Historial</button>
        </div>
        <span className="spacer" />
        {perms(role).write && !adding && <button onClick={() => setAdding(true)}>Agregar medicación</button>}      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {adding && (
        <MedForm
          petId={petId}
          known={[...new Set(meds.map((m) => m.name))]}
          onCancel={() => setAdding(false)}
          onCreated={(m) => { setMeds([m, ...meds]); setAdding(false); setView('active') }}
        />
      )}

      {shown.length === 0 && !adding && (
        <p className="muted">{view === 'active' ? 'No hay medicación activa.' : 'Todavía no hay tratamientos finalizados.'}</p>
      )}
      {shown.map((m) => <MedCard key={m.id} med={m} role={role} onChange={replace} />)}
    </>
  )
}