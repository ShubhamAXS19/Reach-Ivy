import axios from 'axios'

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({ baseURL: '/api' })

// ── Token helpers ──────────────────────────────────────────────────────────
export const tokenStorage = {
    getAccess: () => localStorage.getItem('access_token'),
    getRefresh: () => localStorage.getItem('refresh_token'),
    set: (access, refresh) => {
        localStorage.setItem('access_token', access)
        if (refresh) localStorage.setItem('refresh_token', refresh)
    },
    clear: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    },
}

// ── Request interceptor — attach Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// ── Response interceptor — silent token refresh on 401 ────────────────────
let isRefreshing = false
let failedQueue = []   // requests that arrived while a refresh was in progress

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token)
    )
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config

        // Only attempt refresh on 401, and only once per request
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error)
        }

        if (isRefreshing) {
            // Queue the request until the current refresh completes
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`
                return api(original)
            })
        }

        original._retry = true
        isRefreshing = true

        const refreshToken = tokenStorage.getRefresh()
        if (!refreshToken) {
            tokenStorage.clear()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        try {
            const { data } = await axios.post('/api/auth/token/refresh/', {
                refresh: refreshToken,
            })
            tokenStorage.set(data.access, data.refresh)
            processQueue(null, data.access)
            original.headers.Authorization = `Bearer ${data.access}`
            return api(original)
        } catch (refreshError) {
            processQueue(refreshError, null)
            tokenStorage.clear()
            window.location.href = '/login'
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

// ── Auth API ───────────────────────────────────────────────────────────────
export async function registerUser({ email, password, password2 }) {
    const { data } = await api.post('/auth/register/', { email, password, password2 })
    return data
}

export async function loginUser({ email, password }) {
    const { data } = await api.post('/auth/login/', { email, password })
    tokenStorage.set(data.access, data.refresh)
    return data   // { access, refresh, user }
}

export async function logoutUser() {
    const refresh = tokenStorage.getRefresh()
    try {
        await api.post('/auth/logout/', { refresh })
    } finally {
        tokenStorage.clear()
    }
}

export async function getMe() {
    const { data } = await api.get('/auth/me/')
    return data
}

export async function verifyEmail(token) {
    const { data } = await api.post('/auth/verify-email/', { token })
    return data
}

export async function forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password/', { email })
    return data
}

export async function resetPassword({ uid, token, password }) {
    const { data } = await api.post('/auth/reset-password/', { uid, token, password })
    return data
}

// ── App API (existing) ─────────────────────────────────────────────────────
export async function sendChat(messages) {
    const { data } = await api.post('/chat', { messages })
    return data
}

export async function transcribeAudio(audioBlob) {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    const { data } = await api.post('/stt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.transcript
}

export async function textToSpeech(text) {
    const response = await api.post('/tts', { text }, { responseType: 'blob' })
    if (response.status === 204) return null
    return URL.createObjectURL(response.data)
}