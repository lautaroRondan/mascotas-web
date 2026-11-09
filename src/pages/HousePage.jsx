import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { perms } from '../utils.js'

const SPECIES = ['Perro', 'Gato', 'Otro']
const EMPTY = { name: '', species: 'Perro', breed: '', birthDate: '', weightKg: '' }
const errMsg = (e) => e.message || 'No se pudo guardar.'

export default function HousePage({ house, onCreateHouse, onOpenPet }) {
  const [pets, setPets] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [houseName, setHouseName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (house) api.listPets(house.id).then(setPets).catch((e) => setError(errMsg(e))) }, [house])

  // Sin casa todavía: primer paso del MVP
  if (!house) {
    return (
      <section className="card narrow">
        <h2>Creá tu casa</h2>
        <p className="muted">Una casa agrupa a las personas que cuidan a las mismas mascotas.</p>
        <form onSubmit={(e) => { e.preventDefault(); setError(''); onCreateHouse(houseName).catch((er) => setError(errMsg(er))) }}>
          <label>Nombre de la casa<input required value={houseName} onChange={(e) => setHouseName(e.target.value)} placeholder="Ej: Casa de Lauta" /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit">Crear casa</button>
        </form>
      </section>
    )
  }

  const { write: canWrite, owner: isOwner } = perms(house.role)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const pet = await api.createPet(house.id, {
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        birth_date: form.birthDate || null,
        weight_kg: form.weightKg ? Number(form.weightKg) : null,
      })
      setPets([...pets, pet]); setForm(EMPTY); setAdding(false)
    } catch (er) { setError(errMsg(er)) }
  }
  const remove = async (p) => {
    if (!confirm(`¿Eliminar a ${p.name}?`)) return
    try { await api.deletePet(p.id); setPets(pets.filter((x) => x.id !== p.id)) }
    catch (er) { setError(errMsg(er)) }
  }

  return (
    <>
      <div className="row">
        <h2>{house.name}</h2>
        <span className="spacer" />
        {canWrite && !adding && <button onClick={() => setAdding(true)}>Agregar mascota</button>}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {adding && (
        <form className="card grid" onSubmit={save}>
          <label>Nombre<input required value={form.name} onChange={set('name')} /></label>
          <label>Especie<select value={form.species} onChange={set('species')}>{SPECIES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>Raza<input value={form.breed} onChange={set('breed')} /></label>
          <label>Fecha de nacimiento<input type="date" value={form.birthDate} onChange={set('birthDate')} /></label>
          <label>Peso (kg)<input type="number" step="0.1" min="0" value={form.weightKg} onChange={set('weightKg')} /></label>
          <div className="row end">
            <button type="button" className="ghost" onClick={() => setAdding(false)}>Cancelar</button>
            <button type="submit">Guardar mascota</button>
          </div>
        </form>
      )}

      {pets.length === 0 && !adding ? (
        <p className="muted">{canWrite ? 'Todavía no hay mascotas en esta casa. Agregá la primera.' : 'Todavía no hay mascotas en esta casa.'}</p>) : (
        <ul className="pets">
          {pets.map((p) => (
            <li key={p.id} className="card pet">
              <button className="petlink" onClick={() => onOpenPet(p)}>
                <span className="avatar" aria-hidden>{p.name[0].toUpperCase()}</span>
                <span>
                  <strong>{p.name}</strong>
                  <span className="muted block">{[p.species, p.breed, p.weight_kg && `${parseFloat(p.weight_kg)} kg`].filter(Boolean).join(', ')}</span>
                </span>
              </button>
              {isOwner && <button className="ghost" onClick={() => remove(p)}>Eliminar</button>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}