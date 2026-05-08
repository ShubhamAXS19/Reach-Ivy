import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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
  // 204 = browser TTS mode, no audio from server
  if (response.status === 204) return null
  return URL.createObjectURL(response.data)
}