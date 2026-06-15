const TOKEN_KEY = 'blood_bank_token'
const USER_KEY = 'blood_bank_user'

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUserInfo = () => {
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

export const setUserInfo = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeUserInfo = () => {
  localStorage.removeItem(USER_KEY)
}

export const isLoggedIn = () => {
  return !!getToken()
}

export const logout = () => {
  removeToken()
  removeUserInfo()
}
