export function isAdmin(role?: string) {
  return role === 'admin' || role === 'owner'
}