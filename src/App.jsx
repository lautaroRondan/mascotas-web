import { useEffect, useState } from 'react'
import { api, setUnauthorizedHandler } from './api.js'
import AuthPage from './pages/AuthPage.jsx'
import HousePage from './pages/HousePage.jsx'
import PetPage from './pages/PetPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import MembersPage from './pages/MembersPage.jsx'
import InvitePage from './pages/InvitePage.jsx'

// El link de invitación es /?invite=CODIGO. Se guarda en sessionStorage para que sobreviva al login o registro.
function readInvite() {
  const q = new URLSearchParams(location.search).get('invite')
  if (q) {
    sessionStorage.setItem('invite', q)
    history.replaceState(null, '', location.pathname)
  }
  return sessionStorage.getItem('invite')
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(api.hasToken())
  const [houses, setHouses] = useState([])
  const [houseId, setHouseId] = useState(null)
  const [pet, setPet] = useState(null)
  const [screen, setScreen] = useState(null) // null | 'account' | 'members'
  const [inviteCode, setInviteCode] = useState(readInvite)

  const reset = () => { setUser(null); setHouses([]); setHouseId(null); setPet(null); setScreen(null) }
  const logout = () => { api.logout(); reset() }
  const clearInvite = () => { sessionStorage.removeItem('invite'); setInviteCode(null) }

  // Si ya hay token guardado, recuperar el usuario; si venció, volver al login.
  useEffect(() => {
    setUnauthorizedHandler(reset)
    if (api.hasToken()) api.me().then(setUser).catch(() => { }).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!user) return
    api.listHouses().then((hs) => {
      setHouses(hs)
      setHouseId((cur) => cur ?? hs[0]?.id ?? null)
    }).catch(() => { })
  }, [user])

  const addHouse = async (name) => {
    const h = await api.createHouse(name)
    setHouses((hs) => [...hs, h]); setHouseId(h.id)
  }
  const joined = (h) => {
    setHouses((hs) => (hs.some((x) => x.id === h.id) ? hs : [...hs, h]))
    setHouseId(h.id); setPet(null); setScreen(null); clearInvite()
  }
  const left = () => {
    const rest = houses.filter((h) => h.id !== houseId)
    setHouses(rest); setHouseId(rest[0]?.id ?? null); setPet(null); setScreen(null)
  }

  if (checking) return null
  if (!user) {
    return <AuthPage onAuth={setUser} notice={inviteCode ? 'Iniciá sesión o creá tu cuenta para ver tu invitación.' : ''} />
  }
  const house = houses.find((h) => h.id === houseId)

  return (
    <div className="shell">
      <header className="topbar">
        <strong className="brand">Mascotas</strong>
        {houses.length > 0 && (
          <select value={houseId ?? ''} onChange={(e) => { setHouseId(Number(e.target.value)); setPet(null); setScreen(null) }} aria-label="Casa">
            {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
        {house && <button className="ghost" onClick={() => setScreen('members')}>Miembros</button>}
        <span className="spacer" />
        <button className="ghost" onClick={() => setScreen('account')}>{user.display_name}</button>
        <button className="ghost" onClick={logout}>Salir</button>
      </header>
      <main>
        {inviteCode ? (
          <InvitePage code={inviteCode} onAccepted={joined} onCancel={clearInvite} />
        ) : screen === 'account' ? (
          <AccountPage user={user} onBack={() => setScreen(null)} />
        ) : screen === 'members' && house ? (
          <MembersPage house={house} onBack={() => setScreen(null)} onLeft={left} />
        ) : pet ? (
          <PetPage pet={pet} houseName={house?.name} role={house?.role} onBack={() => setPet(null)} onPetChange={setPet} />) : (
          <HousePage house={house} onCreateHouse={addHouse} onOpenPet={setPet} />
        )}
      </main>
    </div>
  )
}