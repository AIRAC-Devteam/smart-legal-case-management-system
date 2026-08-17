const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1'
const TOKEN_KEY = 'auth_token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })

  const data = await parseResponse(response)

  localStorage.setItem(TOKEN_KEY, data.token)

  return data
}


async function parseResponse(response) {
  if (response.status === 204) return null

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const validationMessage =
      data && typeof data === 'object'
        ? Object.entries(data)
            .filter(([key]) => !['detail', 'error', 'message'].includes(key))
            .flatMap(([field, value]) => {
              const messages = Array.isArray(value) ? value : [value]
              return messages
                .filter((item) => typeof item === 'string')
                .map((item) => `${field}: ${item}`)
            })
            .join(' | ')
        : ''

    throw new Error(
      data?.detail ||
        data?.error ||
        data?.message ||
        validationMessage ||
        `خطای سرور (${response.status})`,
    )
  }

  return data
}
async function authFetch(url, options = {}) {
  const token = getAuthToken()

  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Token ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAuthToken()

    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  return response
}
function buildQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

// Health
export async function healthCheck() {
  return parseResponse(await authFetch(`${API_BASE}/health/`))
}

// Documents
export async function uploadDocument(file) {
  if (!file) throw new Error('فایلی انتخاب نشده است.')

  const formData = new FormData()
  formData.append('file', file)

  return parseResponse(
    await authFetch(`${API_BASE}/documents/`, {
      method: 'POST',
      body: formData,
    }),
  )
}

export async function getDocument(documentId) {
  if (!documentId) throw new Error('شناسه سند معتبر نیست.')
  return parseResponse(await authFetch(`${API_BASE}/documents/${documentId}/`))
}

export async function extractDocument(documentId) {
  if (!documentId) throw new Error('شناسه سند معتبر نیست.')

  return parseResponse(
    await authFetch(`${API_BASE}/documents/${documentId}/extract/`, {
      method: 'POST',
    }),
  )
}

export async function reextractDocument(documentId) {
  return extractDocument(documentId)
}

export async function deleteDocument(documentId) {
  if (!documentId) throw new Error('شناسه سند معتبر نیست.')

  await parseResponse(
    await authFetch(`${API_BASE}/documents/${documentId}/`, {
      method: 'DELETE',
    }),
  )
  return true
}

// Cases
export async function createCase(caseData) {
  if (!caseData) throw new Error('اطلاعات پرونده ارسال نشده است.')

  return parseResponse(
    await authFetch(`${API_BASE}/cases/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    }),
  )
}

export async function getCase(caseId) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')
  return parseResponse(await authFetch(`${API_BASE}/cases/${caseId}/`))
}

export async function getCases() {
  return parseResponse(await authFetch(`${API_BASE}/cases/`))
}

export async function listCases() {
  return getCases()
}

export async function updateCase(caseId, caseData) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')
  if (!caseData) throw new Error('اطلاعات پرونده ارسال نشده است.')

  return parseResponse(
    await authFetch(`${API_BASE}/cases/${caseId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    }),
  )
}

export async function replaceCase(caseId, caseData) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')

  return parseResponse(
    await authFetch(`${API_BASE}/cases/${caseId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    }),
  )
}

export async function deleteCase(caseId) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')

  await parseResponse(
    await authFetch(`${API_BASE}/cases/${caseId}/`, {
      method: 'DELETE',
    }),
  )
  return true
}

// Defense drafts
export async function generateDefenseDraft(caseId) {
  if (!caseId) throw new Error('ابتدا پرونده باید تشکیل شود.')

  return parseResponse(
    await authFetch(`${API_BASE}/cases/${caseId}/generate-defense/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

export async function generateDefense(caseId) {
  return generateDefenseDraft(caseId)
}

export async function getCaseDefenseDrafts(caseId) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')
  return parseResponse(
    await authFetch(`${API_BASE}/cases/${caseId}/defense-drafts/`),
  )
}

export async function getDefenseDrafts(params = {}) {
  const query = buildQuery({
    case: params.caseId,
    status: params.status,
    q: params.q,
  })
  return parseResponse(await authFetch(`${API_BASE}/defense-drafts/${query}`))
}

export async function getDefenseDraft(draftId) {
  if (!draftId) throw new Error('شناسه پیش‌نویس معتبر نیست.')
  return parseResponse(await authFetch(`${API_BASE}/defense-drafts/${draftId}/`))
}

export async function updateDefenseDraft(draftId, draftData) {
  if (!draftId) throw new Error('شناسه پیش‌نویس معتبر نیست.')
  if (!draftData) throw new Error('اطلاعات پیش‌نویس ارسال نشده است.')

  return parseResponse(
    await authFetch(`${API_BASE}/defense-drafts/${draftId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData),
    }),
  )
}

export async function deleteDefenseDraft(draftId) {
  if (!draftId) throw new Error('شناسه پیش‌نویس معتبر نیست.')

  await parseResponse(
    await authFetch(`${API_BASE}/defense-drafts/${draftId}/`, {
      method: 'DELETE',
    }),
  )
  return true
}

export { API_BASE }
