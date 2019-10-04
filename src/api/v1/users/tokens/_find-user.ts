export function createQuery({ username, email }): any {
  if (username) {
    return { username }
  } else {
    return { email }
  }
}

export function userCanResetPass(user: any): any {
  let canReset = false
  if ((user.username || user.password) && user.password) {
    canReset = true
  }
  return canReset
}
