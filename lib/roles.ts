// Owner has all abilities of admin
// Admin has full admin access
// Staff has limited operational access (inventory, orders, messages)
// Customer has no admin access

export function isOwner(role?: string) {
  return role === 'owner'
}

export function isAdmin(role?: string) {
  return role === 'admin' || role === 'owner'
}

export function isStaff(role?: string) {
  return role === 'staff' || role === 'admin' || role === 'owner'
}

export function hasAdminAccess(role?: string) {
  return isStaff(role)
}