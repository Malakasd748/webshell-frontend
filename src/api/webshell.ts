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

const apiBase = window.location.origin + (import.meta.env.VITE_API_BASE || '/api')

export async function getChatResponse(content: string): Promise<{ role: 'assistant', content: string }> {
  const { data } = await axios.post<ChatResponse>('/terminal/ai', { role: 'system', content })
  return data.response.response[0].message
}

export function sshLogin(data: { host: string, port: number, username: string, password: string }) {
  return axios.post<{ id: string }>('/shell/ssh', data)
}

export function getSshWsUrl(id: string) {
  return apiBase + `/shell/ssh/${id}`
}

export function sshDownload(id: string, path: string) {
  const url = new URL(apiBase + `/shell/ssh/${id}/download`)
  url.searchParams.set('path', path)
  window.location.assign(url)
}

export function getTcpWsUrl(host: string, port: number) {
  const url = new URL(apiBase + '/shell/tcp')
  url.searchParams.set('host', host)
  url.searchParams.set('port', port.toString())
  return url.toString()
}
