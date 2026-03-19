import { ref, onMounted, onUnmounted } from 'vue'

export interface InputPreferences {
  requireCommandEnterToSubmit: boolean
  taskCompleteNotification: boolean
  taskCompleteSound: boolean
}

const STORAGE_KEY = 'volo_ai_input_preferences'

const DEFAULT_PREFERENCES: InputPreferences = {
  requireCommandEnterToSubmit: false,
  taskCompleteNotification: true,
  taskCompleteSound: false
}

export function readInputPreferences(): InputPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PREFERENCES }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(raw) as Partial<InputPreferences>
    return {
      requireCommandEnterToSubmit: !!parsed.requireCommandEnterToSubmit,
      taskCompleteNotification: parsed.taskCompleteNotification ?? true,
      taskCompleteSound: !!parsed.taskCompleteSound
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function saveInputPreferences(partial: Partial<InputPreferences>) {
  const next = {
    ...readInputPreferences(),
    ...partial
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function useInputPreferences() {
  const preferences = ref<InputPreferences>(readInputPreferences())

  const sync = () => {
    preferences.value = readInputPreferences()
  }

  const updatePreferences = (partial: Partial<InputPreferences>) => {
    preferences.value = saveInputPreferences(partial)
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      sync()
    }
  }

  onMounted(() => {
    sync()
    window.addEventListener('storage', handleStorage)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorage)
  })

  return {
    preferences,
    updatePreferences,
    sync
  }
}
