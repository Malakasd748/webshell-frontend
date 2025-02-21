import Axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import naiveApi from '@/providers/naiveApi'

interface RetryConfig {
  retry: number
  retryDelay: number
  shouldRetry?: (error: AxiosError) => boolean
}

interface RefreshTokenConfig {
  isTokenExpiredError: (error: AxiosError) => boolean
  refreshToken: () => Promise<string>
  applyToken: (token: string, config: ExtendedRequestConfig) => void
}

interface ExtendedRequestConfig extends AxiosRequestConfig {
  __retryConfig?: {
    retryCount: number
  }
  __isRetryingAfterRefresh?: boolean
  headers?: Record<string, string>
}

class AxiosService {
  private axios: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string) => void> = []
  private refreshTokenConfig?: RefreshTokenConfig

  constructor(baseURL: string, retryConfig?: RetryConfig, refreshTokenConfig?: RefreshTokenConfig) {
    this.axios = Axios.create({ baseURL })
    this.refreshTokenConfig = refreshTokenConfig

    if (retryConfig) {
      this.setupRetry(retryConfig)
    }

    this.setupTokenRefresh()
    this.setupErrorHandler()
  }

  private setupRetry(config: RetryConfig) {
    this.axios.interceptors.response.use(undefined, async (error: AxiosError) => {
      const { config: originalConfig } = error
      if (!originalConfig) return Promise.reject(error)

      const axiosConfig = originalConfig as ExtendedRequestConfig
      const retryConfig = axiosConfig.__retryConfig || {
        retryCount: 0,
      }

      if (
        retryConfig.retryCount >= config.retry
        || (config.shouldRetry && !config.shouldRetry(error))
      ) {
        return Promise.reject(error)
      }

      retryConfig.retryCount++
      axiosConfig.__retryConfig = retryConfig

      const delay = config.retryDelay
      await new Promise(resolve => setTimeout(resolve, delay))

      return this.axios(originalConfig)
    })
  }

  private setupTokenRefresh() {
    this.axios.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalConfig = error.config

        if (!originalConfig || !this.refreshTokenConfig) {
          return Promise.reject(error)
        }

        const axiosConfig = originalConfig as ExtendedRequestConfig
        if (
          this.refreshTokenConfig.isTokenExpiredError(error)
          && !axiosConfig.__isRetryingAfterRefresh
        ) {
          if (!this.isRefreshing) {
            this.isRefreshing = true

            try {
              const newToken = await this.refreshTokenConfig.refreshToken()
              this.refreshTokenConfig.applyToken(newToken, axiosConfig)
              this.onRefreshSuccess(newToken)
              return this.axios(originalConfig)
            } catch (refreshError) {
              const error = refreshError instanceof Error ? refreshError : new Error(String(refreshError))
              this.onRefreshFailure()
              return Promise.reject(error)
            } finally {
              this.isRefreshing = false
            }
          }

          return new Promise((resolve) => {
            this.refreshSubscribers.push((token: string) => {
              axiosConfig.__isRetryingAfterRefresh = true
              this.refreshTokenConfig?.applyToken(token, axiosConfig)
              resolve(this.axios(originalConfig))
            })
          })
        }

        return Promise.reject(error)
      },
    )
  }

  private setupErrorHandler() {
    this.axios.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        const msg = (<{ error?: string }>error.response?.data)?.error

        if (msg) {
          naiveApi.message.error(msg)
        }

        return Promise.reject(error)
      },
    )
  }

  private onRefreshSuccess(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token))
    this.refreshSubscribers = []
  }

  private onRefreshFailure() {
    this.refreshSubscribers.forEach(callback => callback(''))
    this.refreshSubscribers = []
  }

  public getInstance(): AxiosInstance {
    return this.axios
  }
}

const defaultService = new AxiosService(import.meta.env.VITE_API_BASE || '/api', {
  retry: 3,
  retryDelay: 1000,
  shouldRetry: (error: AxiosError) => {
    return error.response?.status !== 401
  },
}, {
  isTokenExpiredError: (error: AxiosError) => error.response?.status === 401,
  refreshToken: async () => {
    // 实际刷新token的逻辑
    return Promise.resolve('new_token')
  },
  applyToken: (token: string, config: ExtendedRequestConfig) => {
    // 实际应用token的逻辑，例如：
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  },
})

export default defaultService.getInstance()
