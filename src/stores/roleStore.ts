import { defineStore } from 'pinia'
import type { RoleDetail } from '@/types/roleplay'
import { fetchRoles } from '@/services/roleplay'
import i18n from '@/i18n'
const { t } = i18n.global

export interface Role {
  id: number
  slug?: string
  voice?: string
  name: string
  desc: string
  avatar: string | null
}

const FALLBACK_AVATAR = '/default-avatar.png'

function mapRole(detail: RoleDetail): Role {
  return {
    id: detail.id,
    slug: (detail as any).slug,
    name: detail.name,
    desc: detail.description || t('storeRole.defaultDesc'),
    avatar: detail.avatarUrl || FALLBACK_AVATAR
  }
}

export const useRoleStore = defineStore('roleStore', {
  state: () => ({
    roles: [] as Role[],
    loading: false,
    loaded: false,
    error: '' as string | null
  }),
  getters: {
    getById: (state) => (id: number) => state.roles.find(r => r.id === id),
    getBySlug: (state) => (slug: string) => state.roles.find(r => r.slug === slug)
  },
  actions: {
    async loadRoles(force = false) {
      if (this.loading) return
      if (this.loaded && !force) return
      this.loading = true
      this.error = ''
      try {
        const res = await fetchRoles(true) as any
        const list = res.data ?? res
        this.roles = Array.isArray(list) ? list.map(mapRole) : []
        this.loaded = true
      } catch (error: any) {
        this.error = error?.message || t('storeRole.loadFailed')
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
