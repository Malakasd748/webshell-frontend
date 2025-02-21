import axios from './client'

interface ChatResponse {
  response: {
    response: Array<{
      message: {
        role: 'assistant'
        content: string
      }
    }>
  }
}

export async function getChatResponse(content: string): Promise<{ role: 'assistant', content: string }> {
  const { data } = await axios.post<ChatResponse>('/terminal/ai', { role: 'system', content })
  return data.response.response[0].message
}

export function sshLogin(data: { host: string, port: number, username: string, password: string }) {
  return axios.post<{ id: string }>('/shell/ssh', data)
}

export function getSshWsUrl(id: string) {
  const base = window.location.origin
  const apiPrefix = import.meta.env.VITE_API_BASE || '/api'

  return base + apiPrefix + `/shell/ssh/${id}`
}
