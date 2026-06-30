export const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

const TOKEN_KEY = 'medrese-token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function authSetToken(token) {
  setToken(token)
}

export function authGetToken() {
  return getToken()
}

function buildHeaders(extraHeaders = {}) {
  const token = getToken()
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : null),
    ...extraHeaders,
  }
}

async function request(path, { method = 'GET', body, query, headers } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      url.searchParams.set(k, String(v))
    })
  }

  const res = await fetch(url.toString(), {
    method,
    headers: buildHeaders(headers),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Laravel json errors are already consistent, but also handle non-json
  let payload
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    const message =
      payload?.error?.message || payload?.message || `Request failed (${res.status})`
    const code = payload?.error?.code || 'HTTP_ERROR'
    throw new Error(JSON.stringify({ message, code, status: res.status }))
  }

  return payload
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me', { method: 'GET' }),
  },

  students: {
    index: (params) => request('/students', { method: 'GET', query: params }),
    show: (id) => request(`/students/${id}`, { method: 'GET' }),
    store: (payload) => request('/students', { method: 'POST', body: payload }),

    import: async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      const token = authGetToken()

      const res = await fetch(`${API_BASE_URL}/students/import`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) throw data

      return data
    },
  },

  classes: {
    index: (params) =>
      request('/classes', { method: 'GET', query: params }),

    show: (id) =>
      request(`/classes/${id}`, { method: 'GET' }),

    store: (payload) =>
      request('/classes', { method: 'POST', body: payload }),

    update: (id, payload) =>
      request(`/classes/${id}`, { method: 'PUT', body: payload }),

    destroy: (id) =>
      request(`/classes/${id}`, { method: 'DELETE' }),
  },

  staff: {
    index: (params) => request('/staff', { method: 'GET', query: params }),
  },

  academic: {
    subjects: () => request('/subjects', { method: 'GET' }),
    timetable: (params) => request('/timetable', { method: 'GET', query: params }),
    academicYears: () => request('/academic-years', { method: 'GET' }),
  },

  dashboard: {
    secretary: () => request('/dashboard/secretary', { method: 'GET' }),
    principal: () => request('/dashboard/principal', { method: 'GET' }),
  },


  finance: {
    overview: () => request('/finance/overview', { method: 'GET' }),
    payments: (params) => request('/payments', { method: 'GET', query: params }),
    recordPayment: (payload) => request('/payments', { method: 'POST', body: payload }),
    outstanding: () => request('/outstanding', { method: 'GET' }),
    reports: () => request('/finance/reports', { method: 'GET' }),
    feeStructures: () => request('/fee-structures', { method: 'GET' }),
    invoices: () => request('/invoices', { method: 'GET' }),
  },

  announcements: {
    index: () => request('/announcements', { method: 'GET' }),
  },

  attendance: {
    index: (params) => request('/attendance', { method: 'GET', query: params }),
    store: (payload) => request('/attendance', { method: 'POST', body: payload }),
    storeFajr: (payload) => request('/attendance/fajr', { method: 'POST', body: payload }),
    reports: (params) => request('/attendance/reports', { method: 'GET', query: params }),
  },

  dormitory: {
    overview: () => request('/dormitory', { method: 'GET' }),
    rooms: () => request('/dormitory/rooms', { method: 'GET' }),
    inspections: () => request('/dormitory/inspections', { method: 'GET' }),
    myRoom: () => request('/dormitory/my-room', { method: 'GET' }),
  },

  discipline: {
    history: (params) => request('/discipline/history', { method: 'GET', query: params }),
    myRecord: () => request('/discipline/my-record', { method: 'GET' }),
  },

  extracurricular: {
    index: () => request('/extracurricular', { method: 'GET' }),
  },

  documents: {
    index: () => request('/documents', { method: 'GET' }),
    myDocuments: () => request('/documents/my-documents', { method: 'GET' }),
  },

  assignments: {
    index: () => request('/assignments', { method: 'GET' }),
    myAssignments: () => request('/assignments/my', { method: 'GET' }),
  },
}

