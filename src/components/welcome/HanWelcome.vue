<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useTextConfig } from "@/composables/useTextConfig"
import { useI18n } from 'vue-i18n'

const { getText } = useTextConfig()
const { t } = useI18n()
defineEmits(['suggestion-click'])

const isHovering = ref(false)
const isLoading = ref(false) // Assuming not loading initially for the welcome screen

const containerRef = ref<HTMLElement>()
const logoRef = ref<HTMLElement>()
const titleRef = ref<HTMLElement>()
const descRef = ref<HTMLElement>()

onMounted(() => {
  const tl = gsap.timeline()

  if (logoRef.value) {
    tl.fromTo(logoRef.value,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
    )
  }

  if (titleRef.value) {
    tl.fromTo(titleRef.value,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
  }
  
  if (descRef.value) {
    tl.fromTo(descRef.value,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
  }
})

onUnmounted(() => {
  if (logoRef.value) gsap.killTweensOf(logoRef.value)
  if (titleRef.value) gsap.killTweensOf(titleRef.value)
  if (descRef.value) gsap.killTweensOf(descRef.value)
})
</script>

<template>
  <div ref="containerRef" class="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 select-none">
    
    <!-- Interactive Red Panda Logo -->
    <div 
      ref="logoRef"
      class="relative w-32 h-32 mb-6 cursor-pointer transition-transform duration-300 hover:scale-105"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
       <!-- Glow Effect -->
       <div :class="['absolute inset-0 bg-gradient-to-tr from-orange-400 to-red-300 rounded-full blur-3xl transition-opacity duration-500', isHovering ? 'opacity-60' : 'opacity-0']"></div>
       
       <!-- Red Panda SVG -->
       <div class="relative w-full h-full rounded-full shadow-2xl flex items-center justify-center overflow-hidden">
         <svg viewBox="0 0 200 200" class="w-full h-full">
           <!-- Background Circle Frame -->
           <circle cx="100" cy="100" r="95" fill="#DC2626" /> 
           <circle cx="100" cy="100" r="88" fill="#EA580C" /> 
           
           <!-- Ears -->
           <path d="M 35 60 Q 30 30 65 40" stroke="#7f1d1d" stroke-width="8" fill="#FFF7ED" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M 165 60 Q 170 30 135 40" stroke="#7f1d1d" stroke-width="8" fill="#FFF7ED" stroke-linecap="round" stroke-linejoin="round"/>
           
           <!-- Head Base -->
           <ellipse cx="100" cy="110" rx="75" ry="65" fill="#EA580C" stroke="#7f1d1d" stroke-width="6" />

           <!-- Face White Markings -->
           <path d="M 28 110 Q 28 80 60 90 Q 90 100 100 115 Q 110 100 140 90 Q 172 80 172 110 Q 172 150 140 160 L 60 160 Q 28 150 28 110 Z" fill="#FFF7ED" />

           <!-- Eye Brows -->
           <ellipse cx="65" cy="70" rx="12" ry="8" fill="#FFF7ED" />
           <ellipse cx="135" cy="70" rx="12" ry="8" fill="#FFF7ED" />

           <!-- Eyes -->
           <g style="transform-origin: 100px 95px" :class="(isHovering || isLoading) ? 'animate-wink' : ''">
             <circle cx="65" cy="105" r="14" fill="#451a03" />
             <circle cx="60" cy="100" r="5" fill="white" opacity="0.9" />
             <circle cx="68" cy="110" r="2" fill="white" opacity="0.6" />
             
             <circle cx="135" cy="105" r="14" fill="#451a03" />
             <circle cx="130" cy="100" r="5" fill="white" opacity="0.9" />
             <circle cx="138" cy="110" r="2" fill="white" opacity="0.6" />
           </g>

           <!-- Rosy Cheeks -->
           <ellipse cx="45" cy="125" rx="10" ry="6" fill="#FCA5A5" opacity="0.8" />
           <ellipse cx="155" cy="125" rx="10" ry="6" fill="#FCA5A5" opacity="0.8" />

           <!-- Nose & Mouth Area -->
           <ellipse cx="100" cy="125" rx="18" ry="14" fill="#FFF7ED" />
           <circle cx="100" cy="120" r="7" fill="#451a03" /> 
           
           <path d="M 90 132 Q 100 142 110 132" stroke="#451a03" stroke-width="3" fill="none" stroke-linecap="round" />
         </svg>
       </div>
    </div>

    <!-- Title Area -->
    <h1 ref="titleRef" class="title text-4xl font-bold text-slate-800 dark:text-gray-100 mb-2 tracking-tight text-center" v-html="getText('title', t('welcome.han.title'))">
    </h1>
    <p ref="descRef" class="subtitle text-slate-500 dark:text-gray-400 text-lg font-medium text-center leading-relaxed pt-2"  v-html="getText('subtitle', t('welcome.han.subtitle'))">
    </p>

  </div>
</template>

<style scoped>
@keyframes wink {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.1); }
}
.animate-wink {
  animation: wink 0.3s ease-in-out;
}
</style>