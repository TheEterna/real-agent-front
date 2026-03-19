<template>
  <div class="role-select">
    <header class="hero">
      <div class="hero-main">
        <div class="hero-actions">
          <AButton type="default" shape="circle" :title="t('rolePlay.select.backToPlayground')" :aria-label="t('rolePlay.select.backToPlayground')" @click="goBack">
            <template #icon>
              <ArrowLeftOutlined />
            </template>
          </AButton>
        </div>
        <div class="hero-content">
          <div class="hero-title">{{ t("rolePlay.select.title") }}</div>
          <div class="hero-subtitle">{{ t("rolePlay.select.subtitle") }}</div>
        </div>
      </div>
    </header>

    <main class="workspace">
        <Spin v-if="loading" size="large" class="loading" :tip="t('rolePlay.select.loadingRoles')" />
        <Alert v-else-if="error" type="error" :message="error" show-icon />
        <AEmpty v-else-if="roles.length === 0" :description="t('rolePlay.select.noRoles')" />

        <AList
            v-else
            :data-source="roles"
            :grid="{ gutter: [16, 20], column: column }"
            class="role-list"
        >
          <template #renderItem="{ item }">
            <ListItem>
              <ACard
                  hoverable
                  class="role-card"
                  :aria-label="t('rolePlay.select.selectRole', { name: item.name })"
                  tabindex="0"
                  @click="enter(item)"
                  @keydown.enter="enter(item)"
              >
                <div class="role-item">
                  <div class="role-avatar">
                    <img
                        :src="item.avatar || fallbackAvatar"
                        :alt="t('rolePlay.select.roleAvatar')"
                    />
                  </div>
                  <div class="role-info">
                    <div class="role-name">{{ item.name }}</div>
                    <div class="role-desc">{{ item.desc || t('rolePlay.select.defaultDesc') }}</div>
                  </div>
                </div>
              </ACard>
            </ListItem>
          </template>
        </AList>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { Button as AButton, Card as ACard, Empty as AEmpty, List as AList, ListItem, Spin, Alert } from 'ant-design-vue'
import { useRoleStore, type Role } from '@/stores/roleStore'
import useBreakpoint from "ant-design-vue/es/_util/hooks/useBreakpoint";

const router = useRouter()
const { t } = useI18n()
const goBack = () => router.push('/playground')

const roleStore = useRoleStore()
const roles = computed(() => roleStore.roles)
const loading = computed(() => roleStore.loading)
const error = computed(() => roleStore.error || '')
const fallbackAvatar = '/default-avatar.png'

onMounted(() => {
  if (!roleStore.loaded) {
    roleStore.loadRoles().catch(err => {
      console.error('[RoleSelect] 加载角色失败', err)
    })
  }
})

// 更精细的响应式列数控制
const breakpoint = useBreakpoint()
const column = computed(() => {
  const screens = breakpoint.value
  if (screens.xxxl) return 4
  if (screens.xxl) return 4
  if (screens.xl) return 3
  if (screens.lg) return 3
  if (screens.md) return 3
  if (screens.sm) return 2
  if (screens.xs) return 1
  return 3
})

function enter(role: Role) {
  router.push(`/playground/role-play-agent/${role.id}`)
}

</script>

<style scoped lang="scss">
.role-select {
  width: 100%;
  background: linear-gradient( var(--rp-blue-bright) 100%,  var(--rp-accent-indigo) 50%, var(--rp-accent-red) 0%);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// Hero 区域样式
.hero {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(var(--blur-sm, 8px));
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.2));
  padding: 24px;
  margin-bottom: 24px;
}

.hero-main {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
}

.hero-actions {
  flex-shrink: 0;
}

.hero-content {
  flex: 1;
  text-align: center;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground, #111827);
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--rp-accent-indigo) 0%, var(--rp-accent-royal) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1rem;
  color: var(--muted-foreground, #6b7280);
  line-height: 1.5;
}

// 工作区域
.workspace {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 24px;
  width: 100%;
  text-align: center;
  overflow: auto;
}


.loading {
  margin: 100px auto;

}

.role-list {
  text-align: center;
}

// 角色卡片样式
.role-card {
  cursor: pointer;
  transition: all var(--duration-normal, 200ms) var(--ease-fluid);
  height: 210px; // 固定高度确保一致性
  border-radius: var(--radius-lg, 16px);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.2));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(var(--blur-sm, 8px));
  box-shadow: var(--shadow-md);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary-300, rgba(102, 126, 234, 0.3));
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }

  :deep(.ant-card-body) {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.role-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 16px;
}

.role-avatar {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full, 50%);
  overflow: hidden;
  border: 3px solid var(--color-primary-200, rgba(102, 126, 234, 0.2));
  transition: border-color var(--duration-normal, 200ms) var(--ease-fluid);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.role-card:hover .role-avatar {
  border-color: var(--color-primary-400, rgba(102, 126, 234, 0.5));
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 0; // 允许内容收缩
}

.role-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground, #111827);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.role-desc {
  font-size: 0.8125rem;
  color: var(--muted-foreground, #6b7280);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3; // 最多显示3行
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  width: 100%;
}

// 响应式设计
@media (max-width: 768px) {
  .hero {
    padding: 16px;
    margin-bottom: 16px;
  }

  .hero-main {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.875rem;
  }

  .workspace {
    padding: 0 16px 16px;
  }

  .role-card {
    height: 180px;
  }

  .role-avatar {
    width: 60px;
    height: 60px;
  }

  .role-name {
    font-size: 0.875rem;
  }

  .role-desc {
    font-size: 0.75rem;
    -webkit-line-clamp: 2;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 12px;
  }

  .workspace {
    padding: 0 12px 12px;
  }

  .role-card {
    height: 160px;
  }

  .role-avatar {
    width: 50px;
    height: 50px;
  }
}
</style>

<!-- Dark mode overrides -->
<style lang="scss">
.dark {
  .role-select {
    background: var(--background, #0a0a0a);
  }

  .role-select .hero {
    background: rgba(255, 255, 255, 0.03);
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .role-select .hero-subtitle {
    color: var(--muted-foreground);
  }

  .role-select .role-card {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      border-color: var(--color-primary-400, rgba(102, 126, 234, 0.4));
    }
  }

  .role-select .role-avatar {
    border-color: var(--color-primary-300, rgba(102, 126, 234, 0.3));
  }

  .role-select .role-card:hover .role-avatar {
    border-color: var(--color-primary-400, rgba(102, 126, 234, 0.5));
  }

  .role-select .role-name {
    color: rgba(224, 231, 235, 0.9);
  }

  .role-select .role-desc {
    color: rgba(224, 231, 235, 0.6);
  }
}
</style>
