import crypto from 'crypto'

const ADMIN_EMAILS = ['danielankrah1010@gmail.com', 'kobenaahern77@gmail.com']

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

export function createSessionCookieValue(payload: { email: string; role: string }) {
  const value = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return value
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex')
  return `v1$${salt}$${hash}`
}

export function verifyPassword(storedPassword: string, candidatePassword: string) {
  const [version, salt, storedHash] = storedPassword.split('$')
  if (version !== 'v1' || !salt || !storedHash) {
    return false
  }

  const candidateHash = crypto.createHmac('sha256', salt).update(candidatePassword).digest('hex')
  return candidateHash === storedHash
}
