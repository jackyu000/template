import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  is_active: boolean
  roles: string[]
}

// API client functions
const apiClient = {
  async login(data: LoginData): Promise<User> {
    const response = await fetch('/auth/login/onsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }
    return response.json()
  },

  async getCurrentUser(): Promise<User> {
    const response = await fetch('/auth/me')
    if (!response.ok) {
      throw new Error('Not authenticated')
    }
    return response.json()
  },

  async register(data: RegisterData): Promise<User> {
    const response = await fetch('/auth/register/onsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }
    return response.json()
  },

  async logout(): Promise<void> {
    await fetch('/auth/logout/onsubmit', { method: 'POST' })
  },

  async resetRequest(email: string): Promise<void> {
    const response = await fetch('/auth/reset-request/onsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Reset request failed')
    }
  },

  async resetConfirm(token: string, newPassword: string): Promise<void> {
    const response = await fetch('/auth/reset-confirm/onsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Password reset failed')
    }
  },

  async getPageData(page: string): Promise<any> {
    const response = await fetch(`/${page}/onload`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to load ${page} data`)
    }
    return response.json()
  }
}

// Export the api object for use in route loaders
export const api = {
  auth: apiClient,
  getPageData: apiClient.getPageData
}

// Auth hooks
export function useAuth() {
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: apiClient.login,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })

  const register = useMutation({
    mutationFn: apiClient.register,
  })

  const logout = useMutation({
    mutationFn: apiClient.logout,
    onSuccess: () => {
      queryClient.clear()
    },
  })

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: apiClient.getCurrentUser,
    retry: false,
  })

  return {
    login,
    register,
    logout,
    user: userQuery.data,
    isAuthenticated: !!userQuery.data && !userQuery.isError,
    isLoading: userQuery.isLoading
  }
}

// Page data hook
export function usePageData(page: string) {
  return useQuery({
    queryKey: ['pageData', page],
    queryFn: () => apiClient.getPageData(page),
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false
      return failureCount < 3
    }
  })
}
