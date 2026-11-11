import { useState } from 'react'
import { api } from '../api.js'
import { perms } from '../utils.js'
import PetForm from './pet/PetForm.jsx'
import VisitsTab from './pet/VisitsTab.jsx'
import VaccinesTab from './pet/VaccinesTab.jsx'
import MedsTab from './pet/MedsTab.jsx'

const TABS = [['visits', 'Visitas'], ['vaccines', 'Vacunas'], ['meds', 'Medicación']]

export default function PetPage({ pet, houseName, role, onBack, onPetChange }) {
  const [tab, setTab] = useState('visits')
  const [editing, setEditing] = useState(false)
  const { write: canWrite } = perms(role)

  const save = async (patch) => {
    onPetChange(await api.updatePet(pet.id, patch))
    setEditing(false)
  }

  return (
    <>
      <button className="ghost back" onClick={onBack}>Volver a {houseName ?? 'la casa'}</button>
      {editing ? (
        <PetForm pet={pet} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <div className="row" style={{ marginBottom: '1rem' }}>
          <div>
            <h2>{pet.name}</h2>
            <p className="muted">
              {[pet.species, pet.breed, pet.weight_kg && `${parseFloat(pet.weight_kg)} kg`].filter(Boolean).join(', ')}
            </p>
          </div>
          <span className="spacer" />
          {canWrite && <button className="ghost" onClick={() => setEditing(true)}>Editar</button>}
        </div>
      )}
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {tab === 'visits' && <VisitsTab petId={pet.id} role={role} />}
      {tab === 'vaccines' && <VaccinesTab petId={pet.id} role={role} />}
      {tab === 'meds' && <MedsTab petId={pet.id} role={role} />}
    </>
  )
}