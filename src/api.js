// Cliente de la API FastAPI. El token JWT se guarda en localStorage.
const TOKEN = 'token'
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

function messageFrom(data, status) {
  const d = data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x) => x.msg).join(' ')
  return `Error ${status}`
}

async function request(path, { method = 'GET', json, form } = {}) {
  const headers = {}
  const token = localStorage.getItem(TOKEN)
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json) }
  if (form) body = new URLSearchParams(form) // /auth/login espera application/x-www-form-urlencoded

  let res
  try { res = await fetch(`/api${path}`, { method, headers, body }) }
  catch { throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?') }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) { localStorage.removeItem(TOKEN); onUnauthorized() } // sesión vencida
    const err = new Error(messageFrom(data, res.status))
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  hasToken: () => !!localStorage.getItem(TOKEN),

  me: () => request('/auth/me'),

  async login({ email, password }) {
    try {
      const { access_token } = await request('/auth/login', { method: 'POST', form: { username: email, password } })
      localStorage.setItem(TOKEN, access_token)
    } catch (e) {
      if (e.status === 400 || e.status === 401) throw new Error('Mail o contraseña incorrectos.')
      throw e
    }
    return request('/auth/me')
  },

  async register({ displayName, email, password }) {
    await request('/auth/register', { method: 'POST', json: { email, password, display_name: displayName } })
    return this.login({ email, password })
  },

  logout: () => localStorage.removeItem(TOKEN),

  listHouses: () => request('/households'),
  createHouse: (name) => request('/households', { method: 'POST', json: { name } }),

  listPets: (houseId) => request(`/households/${houseId}/pets`),
  createPet: (houseId, pet) => request(`/households/${houseId}/pets`, { method: 'POST', json: pet }),
  deletePet: (petId) => request(`/pets/${petId}`, { method: 'DELETE' }),

  listVisits: (petId) => request(`/pets/${petId}/visits`),
  createVisit: (petId, v) => request(`/pets/${petId}/visits`, { method: 'POST', json: v }),
  deleteVisit: (id) => request(`/visits/${id}`, { method: 'DELETE' }),

  listVaccines: (petId) => request(`/pets/${petId}/vaccines`),
  createVaccine: (petId, v) => request(`/pets/${petId}/vaccines`, { method: 'POST', json: v }),
  deleteVaccine: (id) => request(`/vaccines/${id}`, { method: 'DELETE' }),
  
  listMeds: (petId) => request(`/pets/${petId}/medications`),
  createMed: (petId, m) => request(`/pets/${petId}/medications`, { method: 'POST', json: m }),
  updateMed: (id, patch) => request(`/medications/${id}`, { method: 'PATCH', json: patch }),
  daySlots: (id) => request(`/medications/${id}/slots`),
  registerDose: (id, d) => request(`/medications/${id}/logs`, { method: 'POST', json: d }),
  
  changeSchedule: (id, body) => request(`/medications/${id}/schedules`, { method: 'POST', json: body }),

  updatePet: (id, patch) => request(`/pets/${id}`, { method: 'PATCH', json: patch }),
  updateVisit: (id, patch) => request(`/visits/${id}`, { method: 'PATCH', json: patch }),
  updateVaccine: (id, patch) => request(`/vaccines/${id}`, { method: 'PATCH', json: patch }),

  
  listMembers: (houseId) => request(`/households/${houseId}/members`),
  changeRole: (houseId, userId, role) => request(`/households/${houseId}/members/${userId}`, { method: 'PATCH', json: { role } }),
  removeMember: (houseId, userId) => request(`/households/${houseId}/members/${userId}`, { method: 'DELETE' }),

  listInvitations: (houseId) => request(`/households/${houseId}/invitations`),
  createInvitation: (houseId, body) => request(`/households/${houseId}/invitations`, { method: 'POST', json: body }),
  revokeInvitation: (houseId, id) => request(`/households/${houseId}/invitations/${id}`, { method: 'DELETE' }),
  previewInvitation: (code) => request(`/invitations/${encodeURIComponent(code)}`),
  acceptInvitation: (code) => request(`/invitations/${encodeURIComponent(code)}/accept`, { method: 'POST' }),

  changePassword: (body) => request('/auth/change-password', { method: 'POST', json: body }),
}