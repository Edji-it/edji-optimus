export function createQuery(user_info: string): any {
  if (usernamePassed(user_info)) {
    return { username: valuePassed(user_info, 9) }
  } else if (emailPassed(user_info)) {
    return { email: valuePassed(user_info, 6) }
  } else {
    return
  }
}

export function userCanResetPass(user: any): any {
  let canReset = false
  if (user.username && user.password) {
    canReset = true
  }
  return canReset
}

// returns true if the user is using a username
function usernamePassed(prop_name: string): boolean {
  if (prop_name.substr(0,8)=='username') {
    return true
  }
}

// returns true if the user is using an email
function emailPassed(prop_name: string): boolean {
  if (prop_name.substr(0,5)=='email') {
    return true
  }
}

// returns the value the user passed in
function valuePassed(prop_name: string, start_pos: number): string {
  return prop_name.substr(start_pos, prop_name.length)
}