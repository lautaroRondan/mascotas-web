import { useState } from 'react'
import { api } from '../api.js'

export default function AccountPage({ user, onBack }) {
  const [f, setF] = useState({ current: '', next: '', repeat: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setOk(false) }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setOk(false)
    if (f.next !== f.repeat) return setError('La contraseña nueva y su repetición no coinciden.')
    try {
      await api.changePassword({ current_password: f.current, new_password: f.next })
      setF({ current: '', next: '', repeat: '' })
      setOk(true)
    } catch (er) { setError(er.message) }
  }

  return (
    <>
      <button className="ghost back" onClick={onBack}>Volver</button>
      <h2>Mi cuenta</h2>
      <p className="muted" style={{ marginBottom: '1rem' }}>{user.display_name} · {user.email}</p>

      <form className="card narrow" onSubmit={submit}>
        <strong>Cambiar contraseña</strong>
        <label>Contraseña actual
          <input type="password" autoComplete="current-password" required value={f.current} onChange={set('current')} />
        </label>
        <label>Contraseña nueva <span className="muted">(mínimo 8 caracteres)</span>
          <input type="password" autoComplete="new-password" required minLength={8} value={f.next} onChange={set('next')} />
        </label>
        <label>Repetir contraseña nueva
          <input type="password" autoComplete="new-password" required minLength={8} value={f.repeat} onChange={set('repeat')} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {ok && <p className="badge" role="status">Contraseña actualizada.</p>}
        <button type="submit">Guardar contraseña</button>
      </form>
    </>
  )
}