import type { Address } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

export interface AddressPayload {
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

export const addressApi = {
  list: () => apiFetch<Envelope<Address[]>>('/user/addresses'),
  create: (payload: AddressPayload) =>
    apiFetch<Envelope<Address>>('/user/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: AddressPayload) =>
    apiFetch<Envelope<Address>>(`/user/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<Envelope<boolean>>(`/user/addresses/${id}`, {
      method: 'DELETE',
    }),
  setDefault: (id: string) =>
    apiFetch<Envelope<Address>>(`/user/addresses/${id}/default`, {
      method: 'PUT',
    }),
}
