import api from './api'
import type { AppRole, SystemUser, SystemUserStatus } from '@/types'

export interface CreateUserPayload {
  name: string
  email: string
  phone?: string
  roleId: string
  roleName?: string
  status?: SystemUserStatus
  password: string
  avatar?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  roleId?: string
  roleName?: string
  status?: SystemUserStatus
  password?: string
  avatar?: string
}

export const usersService = {
  async list(): Promise<SystemUser[]> {
    const { data } = await api.get<SystemUser[]>('/users')
    return data
  },
  async listRoles(): Promise<AppRole[]> {
    const { data } = await api.get<AppRole[]>('/roles')
    return data
  },
  async create(payload: CreateUserPayload): Promise<SystemUser> {
    const { data } = await api.post<SystemUser>('/users', payload)
    return data
  },
  async update(id: string, payload: UpdateUserPayload): Promise<SystemUser> {
    const { data } = await api.put<SystemUser>(`/users/${id}`, payload)
    return data
  },
}
