export function createQuery({ username, email }): any {
  if (username) {
    return { username }
  } else {
    return { email }
  }
}

export function userCanResetPass(user: any): any {
  let canReset = false
  // If the user has an account (username or email) AND the user has either a password or an oauth account
  if ((user.username || user.email) && (user.password || (user.oauth && user.oauth.length > 0))) {
    canReset = true
  }
  return canReset
}
