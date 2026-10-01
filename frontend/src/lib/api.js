export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

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
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
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
    signal: AbortSignal.timeout(20000),
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
    // Përfshijmë edhe errors për validimin 422 në mënyrë që format të mund t'i lexojë
    const errors = payload?.errors || null
    throw new Error(JSON.stringify({ message, code, status: res.status, errors }))
  }

  return payload
}

export const api = {
  certificateTemplates: {
    show: level => request(`/certificate-templates/${level}`),
    save: (level, body) => request(`/certificate-templates/${level}`, { method: 'PUT', body }),
    upload: async (level, body) => {
      const response = await fetch(`${API_BASE_URL}/certificate-templates/${level}`, { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` }, body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Ngarkimi dështoi.');
      return payload;
    },
  },
  homeroom: {
    history: id => request(`/homeroom/${id}/history`),
    historicalReport: (id, historicalId) => request(`/homeroom/${id}/history/${historicalId}`),
    certificates: id => request(`/homeroom/${id}/certificates`),
    index: () => request('/homeroom'),
    show: id => request(`/homeroom/${id}`),
    save: (id, section, body) => request(`/homeroom/${id}/${section}`, { method: 'PUT', body }),
  },
  teacherWorkspace: {
    batchGrades: (classId, subjectId, body) => request(`/teacher/workspace/classes/${classId}/subjects/${subjectId}/grades-batch`, { method: 'PUT', body }),
    index: () => request('/teacher/workspace'),
    course: (classId, subjectId) => request(`/teacher/workspace/classes/${classId}/subjects/${subjectId}`),
    grade: (classId, subjectId, body) => request(`/teacher/workspace/classes/${classId}/subjects/${subjectId}/grades`, { method: 'PUT', body }),
    publish: (classId, subjectId, body) => request(`/teacher/workspace/classes/${classId}/subjects/${subjectId}/publications`, { method: 'POST', body }),
    completeAssignment: (classId, subjectId, id, completed) => request(`/teacher/workspace/classes/${classId}/subjects/${subjectId}/assignments/${id}`, { method: 'PATCH', body: { completed } }),
    saveLesson: (classId, subjectId, body, id) => request(`/teacher/workspace/classes/${classId}/subjects/${subjectId}/lessons${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body }),
  },
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me', { method: 'GET' }),
  },

  profile: {
    show: () => request('/profile', { method: 'GET' }),
    update: (payload) => request('/profile', { method: 'PUT', body: payload }),
    updateEmail: (payload) => request('/profile/email', { method: 'PUT', body: payload }),
    updatePassword: (payload) => request('/profile/password', { method: 'PUT', body: payload }),
    uploadPhoto: async (file) => {
      const body = new FormData()
      body.append('photo', file)
      const token = authGetToken()
      const res = await fetch(`${API_BASE_URL}/profile/photo`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw data
      return data
    },
    deletePhoto: () => request('/profile/photo', { method: 'DELETE' }),
  },

  students: {
    index: (params) => request('/students', { method: 'GET', query: params }),
    show: (id) => request(`/students/${id}`, { method: 'GET' }),
    store: (payload) => request('/students', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/students/${id}`, { method: 'PUT', body: payload }),
    resetPassword: (id) => request(`/students/${id}/reset-password`, { method: 'POST' }),
    destroy: (id) => request(`/students/${id}`, { method: 'DELETE' }),
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
    assignHomeroom: (id, staffId) => request(`/classes/${id}/assign-homeroom`, { method: 'POST', body: { staff_id: staffId } }),
    assignStudents: (id, studentIds) => request(`/classes/${id}/assign-students`, { method: 'POST', body: { student_ids: studentIds } }),
    grades: (classId) => request(`/classes/${classId}/grades`, { method: 'GET' }),
    updateGrade: (classId, payload) => request(`/classes/${classId}/grades`, { method: 'PUT', body: payload }),
  },

  staff: {
    index: (params) => request('/staff', { method: 'GET', query: params }),
    show: (id) => request(`/staff/${id}`, { method: 'GET' }),
    store: (payload) => request('/staff', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/staff/${id}`, { method: 'PUT', body: payload }),
    destroy: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
    import: (rows) => request('/staff/import', { method: 'POST', body: { rows } }),
    uploadPhoto: async (id, file) => {
      const body = new FormData()
      body.append('photo', file)
      const token = authGetToken()
      const res = await fetch(`${API_BASE_URL}/staff/${id}/photo`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw data
      return data
    },
    deletePhoto: (id) => request(`/staff/${id}/photo`, { method: 'DELETE' }),
  },

  academic: {
    subjects: () => request('/academic/subjects', { method: 'GET' }),
    timetable: (params) => request('/academic/timetable', { method: 'GET', query: params }),
    saveTimetableSlot: (payload) => request('/academic/timetable/slots', { method: 'POST', body: payload }),
    deleteTimetableSlot: (id) => request(`/academic/timetable/slots/${id}`, { method: 'DELETE' }),
    updateDaySupervisor: (payload) => request('/academic/day-supervisor', { method: 'PUT', body: payload }),
    previewPromotion: (payload) => request('/academic-years/promotion-preview', { method: 'POST', body: payload }),
    initializeAcademicYear: (payload) => request('/academic-years/initialize', { method: 'POST', body: payload }),
    academicYears: () => request('/academic-years', { method: 'GET' }),
    storeAcademicYear: (payload) => request('/academic-years', { method: 'POST', body: payload }),
    updateAcademicYear: (id, payload) => request(`/academic-years/${id}`, { method: 'PUT', body: payload }),
    activateAcademicYear: (id) => request(`/academic-years/${id}/activate`, { method: 'PUT' }),
    promoteAcademicYear: (id) => request(`/academic-years/${id}/promote`, { method: 'POST' }),
    storeSubject: (payload) => request('/academic/subjects', { method: 'POST', body: payload }),
    updateSubject: (id, payload) => request(`/academic/subjects/${id}`, { method: 'PUT', body: payload }),
    destroySubject: (id) => request(`/academic/subjects/${id}`, { method: 'DELETE' }),
    showSubjectDetails: (id, params) => request(`/academic/subjects/${id}/details`, { method: 'GET', query: params }),
    subjectOptions: (params) => request('/academic/subject-options', { method: 'GET', query: params }),
    assignSubjectToClass: (payload) => request('/academic/subject-assignments', { method: 'POST', body: payload }),
    updateSubjectAssignment: (id, payload) => request(`/academic/subject-assignments/${id}`, { method: 'PUT', body: payload }),
    deleteSubjectAssignment: (id) => request(`/academic/subject-assignments/${id}`, { method: 'DELETE' }),
    getClassSubjectReport: (classId, subjectId) => request(`/academic/report/class/${classId}/subject/${subjectId}`, { method: 'GET' }),
  },
  dashboard: {
    secretary: () => request('/dashboard/secretary', { method: 'GET' }),
    principal: () => request('/dashboard/principal', { method: 'GET' }),
  },

  teacher: {
    schedule: () => request('/teacher/schedule', { method: 'GET' }),
    today: () => request('/teacher/today', { method: 'GET' }),
  },

  studentPortal: {
    overview: () => request('/student/portal'),
    notifications: () => request('/student/notifications'),
    markRead: (keys) => request('/student/notifications/read', { method: 'POST', body: { keys } }),
    manage: () => request('/portal/entries'),
    publish: (body) => request('/portal/entries', { method: 'POST', body }),
    remove: (id) => request(`/portal/entries/${id}`, { method: 'DELETE' }),
    finance: () => request('/student/finance', { method: 'GET' }),
    grades: () => request('/student/grades', { method: 'GET' }),
    attendance: () => request('/student/attendance', { method: 'GET' }),
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
    update: (id, payload) => request(`/attendance/${id}`, { method: 'PUT', body: payload }),
    reports: (params) => request('/attendance/reports', { method: 'GET', query: params }),
    overview: (params) => request('/attendance/overview', { method: 'GET', query: params }),
    reviewAbsence: (payload) => request('/attendance/review', { method: 'POST', body: payload }),
    reviewBatch: (payload) => request('/attendance/review-batch', { method: 'POST', body: payload }),
    pendingReview: () => request('/attendance/pending-review', { method: 'GET' }),
  },

  dormitory: {
    overview: () => request('/dormitory', { method: 'GET' }),
    rooms: (params) => request('/dormitory/rooms', { method: 'GET', query: params }),
    inspections: (params) => request('/dormitory/inspections', { method: 'GET', query: params }),
    showInspection: (id) => request(`/dormitory/inspections/${id}`, { method: 'GET' }),
    myRoom: () => request('/dormitory/my-room', { method: 'GET' }),
    storeInspection: (payload) => request('/dormitory/inspections', { method: 'POST', body: payload }),
    updateInspection: (id, payload) => request(`/dormitory/inspections/${id}`, { method: 'PUT', body: payload }),
    deleteInspection: (id) => request(`/dormitory/inspections/${id}`, { method: 'DELETE' }),
    leaderboard: () => request('/dormitory/leaderboard', { method: 'GET' }),
    assignRoom: (payload) => request('/dormitory/assign-room', { method: 'POST', body: payload }),
    unassignRoom: (id) => request(`/dormitory/unassign-room/${id}`, { method: 'POST' }),
    archiveYear: () => request('/dormitory/archive-year', { method: 'POST' }),
  },

  approvals: {
    index: (params) => request('/approval', { method: 'GET', query: params }),
  },

  discipline: {
    history: (params) => request('/discipline/history', { method: 'GET', query: params }),
    myRecord: () => request('/discipline/my-record', { method: 'GET' }),
    store: (payload) => request('/discipline/record', { method: 'POST', body: payload }),
    categories: () => request('/discipline/categories', { method: 'GET' }),
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

