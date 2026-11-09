import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { ROLE_LABEL, inviteLink } from '../utils.js'

const ROLES = ['owner', 'member', 'readonly']
const INVITE_ROLES = ['member', 'readonly']

export default function MembersPage({ house, onBack, onLeft }) {
  const isOwner = house.role === 'owner'
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)
  const [form, setForm] = useState({ role: 'member', email: '', days: '7' })

  useEffect(() => {
    api.listMembers(house.id).then(setMembers).catch((e) => setError(e.message))
    if (isOwner) api.listInvitations(house.id).then(setInvites).catch((e) => setError(e.message))
  }, [house.id, isOwner])

  const guard = async (fn) => { setError(''); try { await fn() } catch (e) { setError(e.message) } }

  const changeRole = (m, role) => guard(async () => {
    const upd = await api.changeRole(house.id, m.user_id, role)
    setMembers(members.map((x) => (x.user_id === upd.user_id ? upd : x)))
  })
  const remove = (m) => {
    if (!confirm(`¿Quitar a ${m.display_name} de la casa?`)) return
    guard(async () => { await api.removeMember(house.id, m.user_id); setMembers(members.filter((x) => x.user_id !== m.user_id)) })
  }
  const leave = (m) => {
    if (!confirm(`¿Salir de ${house.name}?`)) return
    guard(async () => { await api.removeMember(house.id, m.user_id); onLeft() })
  }

  const copy = async (inv) => {
    try { await navigator.clipboard.writeText(inviteLink(inv.code)); setCopied(inv.id) } catch { /* queda el link visible para copiarlo a mano */ }
  }
  const invite = (e) => {
    e.preventDefault()
    guard(async () => {
      const inv = await api.createInvitation(house.id, {
        role: form.role,
        email: form.email.trim() || null,
        expires_in_days: Number(form.days),
      })
      setInvites([inv, ...invites]); setForm({ ...form, email: '' }); copy(inv)
    })
  }
  const revoke = (inv) => {
    if (!confirm('¿Revocar esta invitación? El link deja de funcionar.')) return
    guard(async () => { await api.revokeInvitation(house.id, inv.id); setInvites(invites.filter((x) => x.id !== inv.id)) })
  }

  return (
    <>
      <button className="ghost back" onClick={onBack}>Volver</button>
      <h2>Miembros de {house.name}</h2>
      {error && <p className="error" role="alert" style={{ margin: '.5rem 0' }}>{error}</p>}

      <ul className="pets" style={{ marginTop: '1rem' }}>
        {members.map((m) => (
          <li key={m.user_id} className="card item" style={{ alignItems: 'center' }}>
            <div>
              <strong>{m.display_name}</strong> {m.is_me && <span className="muted">(vos)</span>}
              {m.email && <div className="muted">{m.email}</div>}
            </div>
            {isOwner && !m.is_me ? (
              <>
                <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} aria-label={`Rol de ${m.display_name}`}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <button className="ghost" onClick={() => remove(m)}>Quitar</button>
              </>
            ) : (
              <span className="badge">{ROLE_LABEL[m.role] ?? m.role}</span>
            )}
            {m.is_me && <button className="ghost" onClick={() => leave(m)}>Salir de la casa</button>}
          </li>
        ))}
      </ul>

      {isOwner && (
        <>
          <h2 style={{ marginTop: '1.5rem' }}>Invitar a alguien</h2>
          <form className="card grid" onSubmit={invite}>
            <label>Rol
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {INVITE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <label>Vence en
              <select value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })}>
                <option value="1">1 día</option><option value="7">7 días</option><option value="30">30 días</option>
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>Mail (opcional, la invitación queda asociada a esa dirección)
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <div className="row end"><button type="submit">Crear link de invitación</button></div>
          </form>

          {invites.length > 0 && <strong>Invitaciones pendientes</strong>}
          <ul className="pets" style={{ marginTop: '.5rem' }}>
            {invites.map((inv) => (
              <li key={inv.id} className="card">
                <div className="row" style={{ marginBottom: '.5rem' }}>
                  <span className="badge">{ROLE_LABEL[inv.role] ?? inv.role}</span>
                  <span className="muted">
                    {inv.email ? `${inv.email} · ` : ''}vence el {new Date(inv.expires_at).toLocaleDateString('es-AR')}
                  </span>
                  <span className="spacer" />
                  <button className="ghost" onClick={() => revoke(inv)}>Revocar</button>
                </div>
                <div className="row" style={{ marginBottom: 0 }}>
                  <input readOnly value={inviteLink(inv.code)} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0 }} />
                  <button onClick={() => copy(inv)}>{copied === inv.id ? 'Copiado' : 'Copiar'}</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}