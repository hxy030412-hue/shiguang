const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = 'Bearer ' + token

  const res = await fetch(BASE + path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export const api = {
  // 认证
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // 用户
  getProfile: () => request('/user/profile'),
  updateProfile: (data) =>
    request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // 照片
  getPhotos: (offset = 0, limit = 20) => request(`/photos?offset=${offset}&limit=${limit}`),
  createPhoto: (data) =>
    request('/photos', { method: 'POST', body: JSON.stringify(data) }),
  updatePhoto: (id, data) =>
    request('/photos/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deletePhoto: (id) =>
    request('/photos/' + id, { method: 'DELETE' }),

  // 上传
  upload: async (file) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(BASE + '/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: form
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '上传失败')
    return data
  }
}
