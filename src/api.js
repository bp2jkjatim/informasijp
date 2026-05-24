export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100'

export const PRIVILEGED_ROLES = ['admin', 'leader', 'kepala_balai', 'ktu']

export function isPrivilegedRole(role) {
  return PRIVILEGED_ROLES.includes(role)
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed')
  }

  return payload
}

export function criteriaLabel(summary) {
  if (!summary) {
    return '-'
  }

  return [
    summary.has_pbj ? 'PBJ' : 'x PBJ',
    summary.has_jabatan ? 'Jabatan' : 'x Jabatan',
    summary.has_integritas ? 'Integritas' : 'x Integritas',
  ].join(' / ')
}

export function trainingCriteriaLabel(training) {
  const flags = []
  if (training.is_pbj) flags.push('PBJ')
  if (training.is_jabatan) flags.push('Jabatan')
  if (training.is_integritas) flags.push('Integritas')
  return flags.length > 0 ? flags.join(', ') : '-'
}
