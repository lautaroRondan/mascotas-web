import { useState } from 'react'

const SPECIES = ['Perro', 'Gato', 'Otro']

export default function PetForm({ pet, onSave, onCancel }) {
  const [f, setF] = useState({
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? '',
    birthDate: pet.birth_date ?? '',
    weightKg: pet.weight_kg ? String(parseFloat(pet.weight_kg)) : '',
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  // Si la especie guardada no está en la lista, se conserva como opción
  const species = SPECIES.includes(f.species) ? SPECIES : [...SPECIES, f.species]

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try {
      await onSave({
        name: f.name.trim(),
        species: f.species,
        breed: f.breed.trim() || null,
        birth_date: f.birthDate || null,
        weight_kg: f.weightKg ? Number(f.weightKg) : null,
      })
    } catch (er) { setError(er.message) }
  }

  return (
    <form className="card grid" onSubmit={submit}>
      <label>Nombre<input required value={f.name} onChange={set('name')} /></label>
      <label>Especie<select value={f.species} onChange={set('species')}>{species.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>Raza<input value={f.breed} onChange={set('breed')} /></label>
      <label>Fecha de nacimiento<input type="date" value={f.birthDate} onChange={set('birthDate')} /></label>
      <label>Peso (kg)<input type="number" step="0.1" min="0" value={f.weightKg} onChange={set('weightKg')} /></label>
      {error && <p className="error" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
      <div className="row end">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit">Guardar cambios</button>
      </div>
    </form>
  )
}