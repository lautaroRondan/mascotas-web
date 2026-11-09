import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { ROLE_LABEL } from '../utils.js'

export default function InvitePage({ code, onAccepted, onCancel }) {
  const [inv, setInv] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.previewInvitation(code).then(setInv).catch((e) => setError(e.message)) }, [code])

  const accept = async () => {
    setBusy(true); setError('')
    try { onAccepted(await api.acceptInvitation(code)) }
    catch (e) { setError(e.message); setBusy(false) }
  }

  if (!inv && !error) return <p className="muted">Cargando invitación…</p>
  if (!inv) {
    return (
      <section className="card narrow">
        <h2>Invitación no disponible</h2>
        <p className="error" role="alert">{error}</p>
        <div className="row end" style={{ marginTop: '.75rem' }}><button onClick={onCancel}>Cerrar</button></div>
      </section>
    )
  }

  return (
    <section className="card narrow">
      <h2>Te invitaron a una casa</h2>
      <p>
        {inv.invited_by_name ?? 'Alguien'} te invitó a <strong>{inv.household_name}</strong> con el rol{' '}
        <strong>{ROLE_LABEL[inv.role] ?? inv.role}</strong>.
      </p>
      <p className="muted">Vence el {new Date(inv.expires_at).toLocaleDateString('es-AR')}.</p>

      {inv.already_member && <p className="badge" style={{ whiteSpace: 'normal' }}>Ya sos parte de esta casa.</p>}
      {inv.email_mismatch && (
        <p className="error" role="alert">
          Esta invitación es para otro mail. Salí y entrá con la cuenta correcta.
        </p>
      )}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="row end" style={{ marginTop: '.75rem' }}>
        <button className="ghost" onClick={onCancel}>{inv.already_member ? 'Cerrar' : 'Ahora no'}</button>
        {!inv.already_member && (
          <button onClick={accept} disabled={busy || inv.email_mismatch}>Aceptar invitación</button>
        )}
      </div>
    </section>
  )
}