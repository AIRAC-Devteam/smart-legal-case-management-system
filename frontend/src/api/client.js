const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1'

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

export async function healthCheck() {
  return parseResponse(await fetch(`${API_BASE}/health/`))
}

export async function uploadDocument(file) {
  if (!file) throw new Error('فایلی انتخاب نشده است.')

  const formData = new FormData()
  formData.append('file', file)

  return parseResponse(
    await fetch(`${API_BASE}/documents/`, {
      method: 'POST',
      body: formData,
    }),
  )
}

export async function getDocument(documentId) {
  if (!documentId) throw new Error('شناسه سند معتبر نیست.')
  return parseResponse(await fetch(`${API_BASE}/documents/${documentId}/`))
}

export async function extractDocument(documentId) {
  if (!documentId) throw new Error('شناسه سند معتبر نیست.')

  return parseResponse(
    await fetch(`${API_BASE}/documents/${documentId}/extract/`, {
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
    await fetch(`${API_BASE}/documents/${documentId}/`, {
      method: 'DELETE',
    }),
  )
  return true
}

export async function createCase(caseData) {
  if (!caseData) throw new Error('اطلاعات پرونده ارسال نشده است.')

  return parseResponse(
    await fetch(`${API_BASE}/cases/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    }),
  )
}

export async function getCase(caseId) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')
  return parseResponse(await fetch(`${API_BASE}/cases/${caseId}/`))
}

export async function getCases() {
  return parseResponse(await fetch(`${API_BASE}/cases/`))
}

export async function listCases() {
  return getCases()
}

export async function updateCase(caseId, caseData) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')
  if (!caseData) throw new Error('اطلاعات پرونده ارسال نشده است.')

  return parseResponse(
    await fetch(`${API_BASE}/cases/${caseId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    }),
  )
}

export async function replaceCase(caseId, caseData) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')

  return parseResponse(
    await fetch(`${API_BASE}/cases/${caseId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    }),
  )
}

export async function deleteCase(caseId) {
  if (!caseId) throw new Error('شناسه پرونده معتبر نیست.')

  await parseResponse(
    await fetch(`${API_BASE}/cases/${caseId}/`, {
      method: 'DELETE',
    }),
  )
  return true
}

export async function generateDefenseDraft(caseId) {
  if (!caseId) throw new Error('ابتدا پرونده باید تشکیل شود.')

  return parseResponse(
    await fetch(`${API_BASE}/cases/${caseId}/generate-defense/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

export async function generateDefense(caseId) {
  return generateDefenseDraft(caseId)
}

export { API_BASE }
