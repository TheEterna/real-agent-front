import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getFilterTags, getSystemApps, getBasicApps, getFeaturedApps, getTrendingApps } from './data'
import type { PlaygroundApp } from './types'

/** Filter app list by search query and tag */
function filterApps(apps: PlaygroundApp[], query: string, tag: string): PlaygroundApp[] {
  return apps.filter((app) => {
    if (query) {
      const q = query.toLowerCase()
      const matchesQuery = app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)
      if (!matchesQuery) return false
    }
    if (tag && app.tags && app.tags.length > 0) {
      if (!app.tags.includes(tag)) return false
    }
    return true
  })
}

export function usePlayground() {
  const router = useRouter()

  const searchQuery = ref('')
  const activeTag = ref('hot')

  const isTagActive = (value: string) => activeTag.value === value

  const setActiveTag = (value: string) => {
    activeTag.value = value
  }

  const navigateToApp = (app: PlaygroundApp) => {
    if (app.comingSoon || !app.route) return
    router.push(app.route)
  }

  const filterTags = computed(() => getFilterTags())
  const filteredSystemApps = computed(() => filterApps(getSystemApps(), searchQuery.value, activeTag.value))
  const filteredBasicApps = computed(() => filterApps(getBasicApps(), searchQuery.value, activeTag.value))
  const filteredFeaturedApps = computed(() => filterApps(getFeaturedApps(), searchQuery.value, activeTag.value))
  const filteredTrendingApps = computed(() => filterApps(getTrendingApps(), searchQuery.value, activeTag.value))

  return {
    filterTags,
    systemApps: filteredSystemApps,
    basicApps: filteredBasicApps,
    featuredApps: filteredFeaturedApps,
    trendingApps: filteredTrendingApps,
    searchQuery,
    activeTag,
    isTagActive,
    setActiveTag,
    navigateToApp,
  }
}
