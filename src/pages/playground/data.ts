import i18n from '@/i18n'
import type { FilterTag, PlaygroundApp } from './types'

const { t } = i18n.global

export function getFilterTags(): FilterTag[] {
  return [
    { label: t('playground.filterTags.hot'), value: 'hot' },
    { label: t('playground.filterTags.writing'), value: 'writing' },
    { label: t('playground.filterTags.productivity'), value: 'productivity' },
    { label: t('playground.filterTags.research'), value: 'research' },
    { label: t('playground.filterTags.dataAnalysis'), value: 'data-analysis' },
    { label: t('playground.filterTags.coding'), value: 'coding' },
  ]
}

export function getSystemApps(): PlaygroundApp[] {
  return [
  {
    id: 'knowledge-base',
    name: t('playground.apps.knowledgeBase'),
    description: t('playground.apps.knowledgeBaseDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%236366f1"/><rect x="18" y="16" width="28" height="32" rx="4" stroke="%23fff" stroke-width="2.5" fill="none"/><line x1="24" y1="26" x2="40" y2="26" stroke="%23fff" stroke-width="2"/><line x1="24" y1="34" x2="36" y2="34" stroke="%23fff" stroke-width="2"/><line x1="24" y1="42" x2="32" y2="42" stroke="%23fff" stroke-width="2"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/knowledge',
    tags: ['hot', 'research', 'productivity'],
  },
  {
    id: 'chat-assistant',
    name: t('playground.apps.chatAssistant'),
    description: t('playground.apps.chatAssistantDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23f59e0b"/><ellipse cx="32" cy="30" rx="16" ry="12" fill="%23fff"/><circle cx="26" cy="28" r="2" fill="%23f59e0b"/><circle cx="38" cy="28" r="2" fill="%23f59e0b"/><path d="M28 34 Q32 38 36 34" stroke="%23f59e0b" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/playground/chat',
    tags: ['hot', 'productivity'],
  },
  {
    id: 'tools-hub',
    name: t('playground.apps.toolsHub'),
    description: t('playground.apps.toolsHubDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%230d9488"/><path d="M32 16 L40 24 L32 32 L24 24 Z" fill="%23fff"/><path d="M32 32 L40 40 L32 48 L24 40 Z" fill="%23fff" opacity="0.6"/><circle cx="32" cy="32" r="4" fill="%23fff"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/playground/tools',
    tags: ['hot', 'productivity', 'coding'],
  },
  {
    id: 'skills-hub',
    name: t('playground.apps.skillsHub'),
    description: t('playground.apps.skillsHubDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%237c3aed"/><circle cx="32" cy="28" r="8" fill="%23fff"/><path d="M20 48 Q32 36 44 48" stroke="%23fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M26 24 L28 22 L30 24" stroke="%237c3aed" stroke-width="2" fill="none"/><circle cx="28" cy="23" r="1.5" fill="%23fff"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/playground/skills',
    tags: ['hot', 'productivity', 'coding'],
  },
  {
    id: 'digital-avatar',
    name: t('playground.apps.digitalAvatar'),
    description: t('playground.apps.digitalAvatarDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23ec4899"/><circle cx="24" cy="24" r="8" fill="%23fff"/><circle cx="40" cy="24" r="8" fill="%23fff" opacity="0.6"/><path d="M16 44 Q24 36 32 44" stroke="%23fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M32 44 Q40 36 48 44" stroke="%23fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/avatar',
    tags: ['hot'],
  },
  {
    id: 'community-feed',
    name: t('playground.apps.communityFeed'),
    description: t('playground.apps.communityFeedDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%2310b981"/><circle cx="22" cy="22" r="6" fill="%23fff"/><circle cx="42" cy="22" r="6" fill="%23fff" opacity="0.7"/><circle cx="32" cy="38" r="6" fill="%23fff" opacity="0.85"/><line x1="22" y1="28" x2="32" y2="32" stroke="%23fff" stroke-width="2" opacity="0.5"/><line x1="42" y1="28" x2="32" y2="32" stroke="%23fff" stroke-width="2" opacity="0.5"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/feed',
    tags: ['hot'],
  },
  {
    id: 'memory-album',
    name: t('playground.apps.memoryAlbum'),
    description: t('playground.apps.memoryAlbumDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="memGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" style="stop-color:%23f59e0b"/><stop offset="100%25" style="stop-color:%23e5989b"/></linearGradient></defs><rect rx="16" width="64" height="64" fill="url(%23memGrad)"/><rect x="12" y="16" width="40" height="32" rx="4" fill="%23fff" opacity="0.9"/><circle cx="22" cy="26" r="4" fill="%23f59e0b"/><path d="M12 40 l14 -10 l8 6 l12 -12 l6 8 v6 a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 z" fill="%23fcd34d" opacity="0.6"/><circle cx="48" cy="20" r="6" fill="%23e5989b"/><path d="M45 20 l2 2 l4 -4" stroke="%23fff" stroke-width="1.5" fill="none"/></svg>',
    creator: 'VOLO SYSTEM',
    route: '/memory-album',
    tags: ['hot'],
  },
]
}

export function getBasicApps(): PlaygroundApp[] {
  return [
  {
    id: 'basic-chat',
    name: t('playground.apps.basicChat'),
    description: t('playground.apps.basicChatDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%2310b981"/><path d="M20 20 h24 a4 4 0 0 1 4 4 v12 a4 4 0 0 1 -4 4 h-16 l-8 8 v-8 a4 4 0 0 1 -4 -4 v-12 a4 4 0 0 1 4 -4" fill="%23fff"/><circle cx="26" cy="30" r="2" fill="%2310b981"/><circle cx="34" cy="30" r="2" fill="%2310b981"/><circle cx="42" cy="30" r="2" fill="%2310b981"/></svg>',
    creator: 'ChatModel',
    route: '/playground/basic/chat',
    tags: ['hot', 'coding'],
  },
  {
    id: 'basic-image',
    name: t('playground.apps.basicImage'),
    description: t('playground.apps.basicImageDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="imgGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" style="stop-color:%23a855f7"/><stop offset="100%25" style="stop-color:%23ec4899"/></linearGradient></defs><rect rx="16" width="64" height="64" fill="url(%23imgGrad)"/><rect x="12" y="16" width="40" height="32" rx="4" fill="%23fff" opacity="0.9"/><circle cx="22" cy="26" r="4" fill="%23a855f7"/><path d="M12 40 l14 -10 l8 6 l12 -12 l6 8 v6 a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 z" fill="%23e9d5ff"/><rect x="44" y="20" width="6" height="6" rx="1" fill="%23fbbf24"/><rect x="44" y="28" width="6" height="6" rx="1" fill="%2334d399"/><rect x="44" y="36" width="6" height="6" rx="1" fill="%2360a5fa"/></svg>',
    creator: 'ImageModel',
    route: '/playground/basic/image',
    tags: ['hot'],
  },
  {
    id: 'basic-video',
    name: t('playground.apps.basicVideo'),
    description: t('playground.apps.basicVideoDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%233b82f6"/><rect x="12" y="18" width="40" height="28" rx="4" fill="%23fff"/><path d="M28 26 l12 8 l-12 8 z" fill="%233b82f6"/></svg>',
    creator: 'VideoModel',
    route: '/playground/basic/video',
    tags: ['hot'],
  },
  {
    id: 'basic-speech',
    name: t('playground.apps.basicSpeech'),
    description: t('playground.apps.basicSpeechDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23f97316"/><rect x="26" y="16" width="12" height="24" rx="6" fill="%23fff"/><path d="M20 32 a12 12 0 0 0 24 0" stroke="%23fff" stroke-width="3" fill="none"/><line x1="32" y1="44" x2="32" y2="50" stroke="%23fff" stroke-width="3"/><line x1="24" y1="50" x2="40" y2="50" stroke="%23fff" stroke-width="3" stroke-linecap="round"/></svg>',
    creator: 'SpeechModel',
    route: '/playground/basic/speech',
    tags: ['hot'],
  },
]
}

export function getFeaturedApps(): PlaygroundApp[] {
  return [
  {
    id: 'volo-canvas',
    name: t('playground.apps.voloCanvas'),
    description: t('playground.apps.voloCanvasDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="canvasGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" style="stop-color:%236366f1"/><stop offset="100%25" style="stop-color:%23a855f7"/></linearGradient></defs><rect rx="16" width="64" height="64" fill="url(%23canvasGrad)"/><rect x="12" y="12" width="16" height="16" rx="3" fill="%23fff" opacity="0.9"/><rect x="36" y="12" width="16" height="16" rx="3" fill="%23fff" opacity="0.7"/><rect x="12" y="36" width="16" height="16" rx="3" fill="%23fff" opacity="0.7"/><rect x="36" y="36" width="16" height="16" rx="3" fill="%23fff" opacity="0.5"/><circle cx="32" cy="32" r="6" fill="%23fbbf24"/><path d="M20 28 L28 20" stroke="%23fff" stroke-width="2" opacity="0.6"/><path d="M36 44 L44 36" stroke="%23fff" stroke-width="2" opacity="0.6"/></svg>',
    creator: 'VOLO AI',
    route: '/playground/canvas',
    tags: ['hot', 'writing'],
  },
  {
    id: 'video-ai',
    name: t('playground.apps.videoAi'),
    description: t('playground.apps.videoAiDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23000"/><path d="M24 20 L24 44 L44 32 Z" fill="%23fff"/></svg>',
    creator: 'invideo.io',
    tags: ['hot'],
    comingSoon: true,
  },
  {
    id: 'expedia',
    name: t('playground.apps.expedia'),
    description: t('playground.apps.expediaDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23FFEC00"/><circle cx="32" cy="24" r="8" fill="%231a1a1a"/><path d="M20 36 Q32 44 44 36" stroke="%231a1a1a" stroke-width="4" fill="none"/></svg>',
    creator: 'expedia.com',
    tags: ['productivity'],
    comingSoon: true,
  },
  {
    id: 'canva',
    name: t('playground.apps.canva'),
    description: t('playground.apps.canvaDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%2300C4CC"/><path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="%23fff"/></svg>',
    creator: 'community builder',
    tags: ['writing'],
    comingSoon: true,
  },
]
}

export function getTrendingApps(): PlaygroundApp[] {
  return [
  {
    id: 'thesis-writer',
    name: t('playground.apps.thesisWriter'),
    description: t('playground.apps.thesisWriterDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="thesisGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" style="stop-color:%23f59e0b"/><stop offset="100%25" style="stop-color:%23ea580c"/></linearGradient></defs><rect rx="12" width="48" height="48" fill="url(%23thesisGrad)"/><path d="M16 12 L32 12 L36 16 L36 36 L12 36 L12 16 Z" fill="%23fff"/><rect x="16" y="18" width="16" height="2" rx="1" fill="%23f59e0b"/><rect x="16" y="24" width="14" height="2" rx="1" fill="%23fcd34d"/><rect x="16" y="30" width="12" height="2" rx="1" fill="%23fcd34d"/><circle cx="34" cy="34" r="8" fill="%23f59e0b"/><path d="M32 34 L34 36 L37 32" stroke="%23fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    creator: 'VOLO AI',
    route: '/playground/thesis-writer',
    tags: ['hot', 'writing', 'research'],
  },
  {
    id: 'academic-research',
    name: t('playground.apps.academicResearch'),
    description: t('playground.apps.academicResearchDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%239333EA"/><path d="M14 20 L24 14 L34 20 V28 L24 34 L14 28 Z" stroke="%23fff" stroke-width="2" fill="none"/></svg>',
    creator: 'VOLO AI',
    route: '/playground/academic-research',
    tags: ['hot', 'research'],
  },
  {
    id: 'mind-map',
    name: t('playground.apps.mindMap'),
    description: t('playground.apps.mindMapDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%2314b8a6"/><circle cx="24" cy="24" r="4" fill="%23fff"/><circle cx="14" cy="34" r="3" fill="%23fff" opacity="0.8"/><circle cx="34" cy="14" r="3" fill="%23fff" opacity="0.8"/><line x1="24" y1="24" x2="14" y2="34" stroke="%23fff" stroke-width="2"/><line x1="24" y1="24" x2="34" y2="14" stroke="%23fff" stroke-width="2"/></svg>',
    creator: 'VOLO AI',
    route: '/playground/mind-map',
    tags: ['hot', 'productivity'],
  },
  {
    id: 'fitness-coach',
    name: t('playground.apps.fitnessCoach'),
    description: t('playground.apps.fitnessCoachDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%23EA4335"/><circle cx="24" cy="18" r="6" fill="%23fff"/><path d="M12 36 Q24 28 36 36" stroke="%23fff" stroke-width="3" fill="none"/></svg>',
    creator: 'Nourish Coach',
    comingSoon: true,
  },
  {
    id: 'consensus',
    name: t('playground.apps.consensus'),
    description: t('playground.apps.consensusDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%2334A853"/><circle cx="18" cy="24" r="4" fill="%23fff"/><circle cx="30" cy="24" r="4" fill="%23fff"/></svg>',
    creator: 'consensus.app',
    tags: ['research'],
    comingSoon: true,
  },
  {
    id: 'logo-creator',
    name: t('playground.apps.logoCreator'),
    description: t('playground.apps.logoCreatorDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%23000"/><text x="24" y="32" font-size="24" font-weight="bold" text-anchor="middle" fill="%23fff">L</text></svg>',
    creator: 'Design Studio',
    comingSoon: true,
  },
  {
    id: 'role-play',
    name: t('playground.apps.rolePlayAgent'),
    description: t('playground.apps.rolePlayAgentDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%23ff7a45"/><circle cx="24" cy="18" r="6" fill="%23fff"/><path d="M12 36 Q24 28 36 36" stroke="%23fff" stroke-width="2" fill="none"/></svg>',
    route: '/playground/role-play-agent',
    creator: 'VOLO AI',
    tags: ['hot'],
  },
  {
    id: 'chat-analyzer',
    name: t('playground.apps.chatAnalyzer'),
    description: t('playground.apps.chatAnalyzerDesc'),
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="caGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" style="stop-color:%23ec4899"/><stop offset="100%25" style="stop-color:%23f43f5e"/></linearGradient></defs><rect rx="12" width="48" height="48" fill="url(%23caGrad)"/><path d="M24 14 C18 14 13 18.5 13 24 C13 27 14.5 29.5 17 31 L16 36 L21 33 C22 33.3 23 33.5 24 33.5 C30 33.5 35 29 35 24 C35 18.5 30 14 24 14Z" fill="%23fff"/><circle cx="20" cy="23" r="1.5" fill="%23ec4899"/><circle cx="24" cy="23" r="1.5" fill="%23ec4899"/><circle cx="28" cy="23" r="1.5" fill="%23ec4899"/></svg>',
    route: '/playground/chat-analyzer',
    creator: 'VOLO AI',
    tags: ['hot'],
  },
]
}
