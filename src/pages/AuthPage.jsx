import { useState } from 'react'
import { api } from '../api.js'

export default function AuthPage({ onAuth, notice }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ displayName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { onAuth(await (mode === 'login' ? api.login(f) : api.register(f))) }
    catch (err) { setError(err.message) }
  }

  return (
    <div className="auth">
      <h1>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</h1>
      <p className="muted">Vacunas, visitas y medicación de tus mascotas, en un solo lugar.</p>
            {notice && <p className="badge" style={{ whiteSpace: 'normal', marginTop: '.5rem' }}>{notice}</p>}
      <form onSubmit={submit}>
        {mode === 'register' && <label>Nombre<input required value={f.displayName} onChange={set('displayName')} /></label>}
        <label>Mail<input required type="email" value={f.email} onChange={set('email')} /></label>
        <label>Contraseña{mode === 'register' && <span className="muted"> (mínimo 8 caracteres)</span>}<input required type="password" minLength={8} value={f.password} onChange={set('password')} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta'}
      </button>
    </div>
  )
}
