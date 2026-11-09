// Las fechas de la API vienen como 'YYYY-MM-DD'; se parsean a mano para evitar corrimientos de zona horaria.
export const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}` }
export const todayISO = () => {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}
export const daysUntil = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date()
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  return Math.round((new Date(y, m - 1, d) - today) / 86400000)
}
export const money = (v) => `$ ${Number(v).toLocaleString('es-AR')}`
export const num = (v) => parseFloat(v).toLocaleString('es-AR', { maximumFractionDigits: 3 })

export const ROLE_LABEL = { owner: 'Dueño', member: 'Miembro', readonly: 'Solo lectura' }
export const inviteLink = (code) => `${location.origin}/?invite=${encodeURIComponent(code)}`

// owner: todo; member: escribir; readonly: solo mirar (y registrar tomas)
export const perms = (role) => ({ write: role === 'owner' || role === 'member', owner: role === 'owner' })