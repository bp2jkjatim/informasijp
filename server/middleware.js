import { findUserByUsername, isPrivilegedRole, sanitizeUser } from './auth.js'

export async function attachSessionUser(request, _response, next) {
  const username = request.session?.username
  if (!username) {
    request.currentUser = null
    next()
    return
  }

  try {
    const user = await findUserByUsername(username)
    request.currentUser = sanitizeUser(user)
    next()
  } catch (error) {
    next(error)
  }
}

export function requireAuth(request, response, next) {
  if (!request.currentUser) {
    response.status(401).json({
      ok: false,
      message: 'Authentication required',
    })
    return
  }

  next()
}

export function requirePrivilegedRole(request, response, next) {
  if (!request.currentUser || !isPrivilegedRole(request.currentUser.role)) {
    response.status(403).json({
      ok: false,
      message: 'Forbidden',
    })
    return
  }

  next()
}
