<!--
  登录页面重塑 - 主页面组件
  
  全屏沉浸式登录体验，采用左右分栏布局
  左侧：品牌展示区域
  右侧：认证表单区域
  
  Refactored based on provided React design.
-->

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { notification } from 'ant-design-vue';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { 
  ArrowRight, 
  Loader2, 
  Mail, 
  Smartphone, 
  Lock, 
  KeyRound, 
  Timer, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Shield
} from 'lucide-vue-next';
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

// Modes: 'login' | 'register'
const isLoginMode = ref(true);

// Login Channel: 'email' | 'phone'
const loginChannel = ref<'email' | 'phone'>('email');

// Email Auth Method for Login: 'password' (Email+Password) | 'code' (Email+Code)
const emailLoginMethod = ref<'password' | 'code'>('password');

const loading = ref(false);
const sendingCode = ref(false);

const LAST_LOGIN_EMAIL_KEY = 'last_login_email';

// Form State
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
// verificationCode is used for both Email Code (in Register) and Phone Code (in Login/Register)
const verificationCode = ref('');
const showPassword = ref(false);

// Timer State
const countdown = ref(0);
let timer: ReturnType<typeof setTimeout> | null = null;

watch(countdown, (newVal) => {
  if (newVal > 0) {
    timer = setTimeout(() => {
      countdown.value--;
    }, 1000);
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

onMounted(() => {
  try {
    const cached = localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    if (cached && !email.value) {
      email.value = cached;
    }
  } catch {
  }
});

const handleSendCode = async () => {
  if (sendingCode.value) return       // Guard: 防重入
  if (countdown.value !== 0) return;

  // 注册一律走邮箱验证码
  const shouldSendEmailCode = !isLoginMode.value || loginChannel.value === 'email';

  if (shouldSendEmailCode) {
    if (!email.value) {
      notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterEmail') });
      return;
    }
    if (!email.value.includes('@')) {
      notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.invalidEmail') });
      return;
    }

    sendingCode.value = true;
    try {
      const response = await authApi.sendEmailCode(email.value);
      if (response.code === 200) {
        countdown.value = 60;
        notification.success({ message: t('login.notification.sendSuccess'), description: t('login.notification.emailCodeSent') });
      } else {
        notification.error({ message: t('login.notification.sendFailed'), description: response.message || t('login.notification.retryLater') });
      }
    } catch (error: any) {
      notification.error({ message: t('login.notification.sendFailed'), description: error?.message || t('login.notification.networkError') });
    } finally {
      sendingCode.value = false;
    }

    return;
  }

  // 登录且选择手机号：发送短信验证码
  if (!phone.value) {
    notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterPhone') });
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.invalidPhone') });
    return;
  }

  sendingCode.value = true;
  try {
    const response = await authApi.sendSmsCode(phone.value);
    if (response.code === 200) {
      countdown.value = 60;
      notification.success({ message: t('login.notification.sendSuccess'), description: t('login.notification.phoneCodeSent') });
    } else {
      notification.error({ message: t('login.notification.sendFailed'), description: response.message || t('login.notification.retryLater') });
    }
  } catch (error: any) {
    notification.error({ message: t('login.notification.sendFailed'), description: error?.message || t('login.notification.networkError') });
  } finally {
    sendingCode.value = false;
  }
};

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  if (loading.value) return           // Guard: 防重入

  // Validation
  if (!isLoginMode.value) {
    if (password.value !== confirmPassword.value) {
      notification.error({ message: t('login.notification.validationFailed'), description: t('login.new.passwordMismatch') });
      return;
    }
    // Only check verification code if it's required for registration
    if (verificationCode.value.length !== 6) {
      notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterSixDigitCode') });
      return;
    }
  }

  if (isLoginMode.value) {
    if (loginChannel.value === 'email') {
      if (emailLoginMethod.value === 'password') {
        if (!email.value || !password.value) {
          notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterEmailAndPassword') });
          return;
        }
      } else {
        if (!email.value || !verificationCode.value) {
          notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterEmailAndCode') });
          return;
        }
        if (!/^\d{6}$/.test(verificationCode.value)) {
          notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterSixDigitCode') });
          return;
        }
      }
    } else {
      if (!phone.value || !verificationCode.value) {
        notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterPhoneAndCode') });
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(phone.value)) {
        notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.invalidPhone') });
        return;
      }
      if (!/^\d{6}$/.test(verificationCode.value)) {
        notification.error({ message: t('login.notification.validationFailed'), description: t('login.notification.enterSixDigitCode') });
        return;
      }
    }
  }

  loading.value = true;

  try {
    if (isLoginMode.value) {
      // 登录
      if (loginChannel.value === 'email') {
        if (emailLoginMethod.value === 'password') {
          await authStore.login({ 
            email: email.value, 
            password: password.value 
          });
          try { localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.value); } catch {}
          notification.success({ message: t('login.notification.loginSuccess'), description: t('login.notification.welcomeBackDesc') });
        } else {
          // 邮箱验证码登录
          await authStore.loginByEmailCode(email.value, verificationCode.value);
          try { localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.value); } catch {}
          notification.success({ message: t('login.notification.loginSuccess'), description: t('login.notification.welcomeBackDesc') });
        }
      } else {
        // 手机号验证码登录
        await authStore.loginByPhoneCode(phone.value, verificationCode.value);
        try { if (authStore.user?.email) localStorage.setItem(LAST_LOGIN_EMAIL_KEY, authStore.user.email); } catch {}
        notification.success({ message: t('login.notification.loginSuccess'), description: t('login.notification.welcomeBackDesc') });
      }
    } else {
      // 注册
      await authStore.register({
        email: email.value,
        password: password.value,
        code: verificationCode.value
      });
      notification.success({ message: t('login.notification.registerSuccess'), description: t('login.notification.registerSuccessDesc') });
      // 注册成功后切换到登录模式，保留邮箱和密码减少用户重复输入
      isLoginMode.value = true;
      emailLoginMethod.value = 'password';
      confirmPassword.value = '';
      verificationCode.value = '';
      loading.value = false;
      return;
    }
    
    // 登录成功后跳转
    const redirect = router.currentRoute.value.query.redirect as string;
    router.push(redirect || '/chat');
  } catch (error: any) {
    const errorMsg = error?.message || t('login.notification.operationFailed');
    notification.error({
      message: isLoginMode.value ? t('login.notification.loginFailed') : t('login.notification.registerFailed'),
      description: errorMsg 
    });
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  // Reset inputs
  // If switching to register, default to password (Email) as per React code hint
  if (!isLoginMode.value) {
      loginChannel.value = 'email';
      emailLoginMethod.value = 'password';
  }
  
  password.value = '';
  phone.value = '';
  confirmPassword.value = '';
  verificationCode.value = '';
  // Keep email/phone if useful? React code doesn't explicitly clear them on toggleMode, but original did.
  // Let's keep them for better UX or clear them? Original code cleared them.
  // email.value = ''; 
  // phone.value = '';
};

const toggleLoginChannel = () => {
  loginChannel.value = loginChannel.value === 'email' ? 'phone' : 'email';
  countdown.value = 0;
  verificationCode.value = '';
};

const toggleEmailLoginMethod = () => {
  emailLoginMethod.value = emailLoginMethod.value === 'password' ? 'code' : 'password';
  countdown.value = 0;
  verificationCode.value = '';
};

const passwordMismatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value;
});

// Norman 约束原则：表单未填完时禁用提交，防错优于纠错
const isSubmitDisabled = computed(() => {
  if (loading.value) return true;
  if (isLoginMode.value) {
    if (loginChannel.value === 'email') {
      if (emailLoginMethod.value === 'password') {
        return !email.value || !password.value;
      }
      return !email.value || !verificationCode.value;
    }
    return !phone.value || !verificationCode.value;
  }
  // 注册模式
  return !email.value || !password.value || !confirmPassword.value || !verificationCode.value || !!passwordMismatch.value;
});
</script>

<template>
  <div class="min-h-screen w-full flex bg-white dark:bg-zinc-900 font-sans overflow-hidden">
    
    <!-- Left Panel - Immersive Experience -->
    <div class="hidden lg:flex w-1/2 relative bg-zinc-950 overflow-hidden flex-col justify-between p-12 text-white">
      <!-- Animated Background Mesh -->
      <div class="absolute inset-0 z-0">
          <div class="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div class="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
          <div class="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[100px] animate-pulse-slow delay-700" />
          <!-- Grid Overlay -->
          <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <!-- Brand -->
      <div class="relative z-10 flex items-center gap-3">
         <img src="/logo.png" alt="Volo AI Logo" class="w-10 h-10" />
         <span class="text-xl font-bold tracking-tight">VOLO AI</span>
      </div>

      <!-- Impactful Copy -->
      <div class="relative z-10 space-y-8 max-w-lg">
         <Transition name="fade-slide" mode="out-in">
           <div :key="isLoginMode ? 'login-text' : 'register-text'">
             <h1 class="text-5xl font-display font-bold leading-tight mb-6">
               <template v-if="isLoginMode">
                 {{ t('login.new.brand.loginTitle1') }} <br/>
                 <span class="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-200">{{ t('login.new.brand.loginTitle2') }}</span>
               </template>
               <template v-else>
                 {{ t('login.new.brand.registerTitle1') }} <br/>
                 <span class="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-200">{{ t('login.new.brand.registerTitle2') }}</span>
               </template>
             </h1>
             <p class="text-lg text-slate-400 dark:text-zinc-500 font-light leading-relaxed">
               {{ t('login.new.brand.description') }}
             </p>
           </div>
         </Transition>

         <div class="flex gap-4 pt-4">
            <div class="flex -space-x-3">
               <img v-for="i in 4" :key="i" :src="`https://picsum.photos/40/40?random=${i}`" class="w-10 h-10 rounded-full border-2 border-black" alt="User" />
            </div>
            <div class="flex flex-col justify-center">
               <div class="flex text-emerald-400 text-xs">★★★★★</div>
               <span class="text-xs text-slate-500 dark:text-zinc-400">{{ t('login.new.brand.usersJoined') }}</span>
            </div>
         </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 text-xs text-slate-600 dark:text-zinc-300 flex gap-6">
         <span>© 2025 VOLO INTELLIGENCE</span>
         <span class="hover:text-slate-400 dark:hover:text-zinc-300 cursor-pointer transition-colors">{{ t('login.new.brand.privacy') }}</span>
         <span class="hover:text-slate-400 dark:hover:text-zinc-300 cursor-pointer transition-colors">{{ t('login.new.brand.terms') }}</span>
      </div>
    </div>

    <!-- Right Panel - Functional Form -->
    <div class="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 relative overflow-y-auto">
       <div class="w-full max-w-[420px] space-y-8 entry-animation py-10">
          
          <!-- Mobile Header (Only visible on small screens) -->
          <div class="lg:hidden flex items-center gap-2 mb-8 justify-center">
             <img src="/logo.png" alt="Volo AI Logo" class="w-7 h-7" />
             <span class="text-lg font-bold text-slate-900 dark:text-white">VOLO AI</span>
          </div>

          <div class="text-center lg:text-left">
             <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
               {{ isLoginMode
                    ? (loginChannel === 'phone' ? t('login.new.titlePhoneLogin') : (emailLoginMethod === 'password' ? t('login.new.titleWelcomeBack') : t('login.new.titleCodeLogin')))
                    : t('login.new.titleCreateAccount') }}
             </h2>
             <p class="text-slate-500 dark:text-zinc-400 text-base mt-2">
               {{ isLoginMode
                    ? (loginChannel === 'phone' ? t('login.new.subtitlePhone') : (emailLoginMethod === 'password' ? t('login.new.subtitlePassword') : t('login.new.subtitleCode')))
                    : t('login.new.subtitleRegister') }}
             </p>
          </div>

          <!-- Social / Third-party Login -->
          <div :class="isLoginMode ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'">
             <button type="button" class="flex items-center justify-center gap-2 min-h-[44px] px-4 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 transition-all group">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span class="text-sm font-medium text-slate-600 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white">Google</span>
             </button>
             
             <button 
              v-if="isLoginMode"
              type="button"
              class="flex items-center justify-center gap-2 min-h-[44px] px-4 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 transition-all group"
              @click="toggleLoginChannel"
             >
                <template v-if="loginChannel === 'email'">
                    <Smartphone class="w-5 h-5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                    <span class="text-sm font-medium text-slate-600 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white">{{ t('login.new.phoneLogin') }}</span>
                </template>
                <template v-else>
                    <Mail class="w-5 h-5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                    <span class="text-sm font-medium text-slate-600 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white">{{ t('login.new.emailLogin') }}</span>
                </template>
             </button>
          </div>

          <div class="relative flex items-center justify-center">
             <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-100 dark:border-zinc-700"></div>
             </div>
             <span class="relative bg-white dark:bg-zinc-900 px-4 text-xs text-slate-400 dark:text-zinc-500 tracking-wider">{{ t('login.new.orContinueWith') }}</span>
          </div>

          <!-- Main Form -->
          <form class="space-y-5" @submit="handleSubmit">
             <div class="space-y-4">
                <!-- Login Method: Email -->
                <div v-if="loginChannel === 'email'" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <!-- Email Input -->
                    <div class="relative group">
                       <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                       <input 
                          v-model="email" 
                          type="email"
                          required
                          :placeholder="t('login.new.emailPlaceholder')"
                          class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                       />
                    </div>
                    
                    <!-- Password Input (Email password login OR Register) -->
                    <div v-if="!isLoginMode || emailLoginMethod === 'password'" class="relative group">
                       <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                       <input 
                           v-model="password"
                           :type="showPassword ? 'text' : 'password'"
                           required
                           :placeholder="isLoginMode ? t('login.new.passwordPlaceholder') : t('login.new.passwordRegisterPlaceholder')"
                           class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                       />
                       <button
                          type="button"
                          :aria-label="showPassword ? t('login.new.hidePassword') : t('login.new.showPassword')"
                          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                          @click="showPassword = !showPassword"
                        >
                          <EyeOff v-if="showPassword" :size="16" />
                          <Eye v-else :size="16" />
                        </button>
                    </div>

                    <!-- Email Code Login (Login only) -->
                    <div v-else class="relative">
                        <Shield class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                        <input 
                            v-model="verificationCode" 
                            type="text"
                            required
                            :placeholder="t('login.new.codePlaceholder')"
                            class="w-full pl-10 pr-32 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                        />
                        <button
                            type="button"
                            :disabled="countdown > 0"
                            :class="[
                                'absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold transition-all min-h-[40px]',
                                countdown > 0
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                                    : 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/70'
                            ]"
                            @click="handleSendCode"
                        >
                            {{ countdown > 0 ? t('login.new.resendCode', { seconds: countdown }) : t('login.new.getCode') }}
                        </button>
                    </div>

                    <!-- Register Mode Extras: Confirm Password & Email Code -->
                    <Transition name="expand">
                      <div v-if="!isLoginMode" class="space-y-4 overflow-hidden">
                         <!-- Confirm Password -->
                         <div class="relative group">
                            <CheckCircle2 class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                            <input
                                v-model="confirmPassword"
                                type="password"
                                required
                                :placeholder="t('login.new.confirmPasswordPlaceholder')"
                                :aria-invalid="passwordMismatch ? 'true' : undefined"
                                :aria-describedby="passwordMismatch ? 'password-mismatch-hint' : undefined"
                                :class="[
                                  'w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500',
                                  passwordMismatch
                                    ? 'border-destructive/40 focus:border-destructive focus:ring-destructive/10'
                                    : 'border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/10'
                                ]"
                            />
                            <p v-if="passwordMismatch" id="password-mismatch-hint" class="mt-1.5 text-xs text-destructive flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              {{ t('login.new.passwordMismatch') }}
                            </p>
                         </div>
                         
                        <!-- Email Verification Code -->
                        <div class="relative">
                            <KeyRound class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                            <input 
                                v-model="verificationCode" 
                                type="text"
                                required
                                :placeholder="t('login.new.emailCodePlaceholder')"
                                class="w-full pl-10 pr-28 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                            />
                            <button
                              type="button"
                              :disabled="countdown > 0"
                              :class="[
                                'absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-medium transition-colors min-h-[40px]',
                                countdown > 0 ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed' : 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/70'
                              ]"
                              @click="handleSendCode"
                            >
                              <span v-if="countdown > 0" class="flex items-center gap-1"><Timer :size="12"/> {{ countdown }}s</span>
                              <span v-else>{{ t('login.new.getCode') }}</span>
                            </button>
                         </div>
                      </div>
                    </Transition>
                </div>
                
                <!-- Login Method: Phone (Phone + Code) -->
                <div v-else class="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div class="relative group">
                         <Smartphone class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                         <input 
                            v-model="phone" 
                            type="tel"
                            required
                            :placeholder="t('login.new.phonePlaceholder')"
                            class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                         />
                    </div>
                    <div class="relative group">
                         <Shield class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" :size="18" />
                         <input 
                            v-model="verificationCode" 
                            type="text"
                            required
                            :placeholder="t('login.new.codePlaceholder')"
                            class="w-full pl-10 pr-32 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                         />
                         <button
                            type="button"
                            :disabled="countdown > 0"
                            :class="[
                                'absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold transition-all min-h-[40px]',
                                countdown > 0
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                                    : 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/70'
                            ]"
                            @click="handleSendCode"
                         >
                            {{ countdown > 0 ? t('login.new.resendCode', { seconds: countdown }) : t('login.new.getCode') }}
                         </button>
                    </div>
                </div>
             </div>

             <!-- Remember Me & Forgot Password (Only for Password Login) -->
             <div v-if="isLoginMode && loginChannel === 'email'" class="flex items-center justify-end text-xs">
              
                <button type="button" class="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline min-h-[44px] inline-flex items-center transition-colors" @click="toggleEmailLoginMethod">{{ emailLoginMethod === 'password' ? t('login.new.codeLogin') : t('login.new.passwordLogin') }}</button>
             </div>

             <button
               type="submit"
               :disabled="isSubmitDisabled"
               class="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white! dark:text-zinc-900! font-bold shadow-lg shadow-slate-900/20 dark:shadow-zinc-100/10 hover:shadow-xl hover:shadow-slate-900/30 dark:hover:shadow-zinc-100/20 active:scale-95 transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               <Loader2 v-if="loading" :size="18" class="animate-spin" />
               <span v-else class="flex items-center gap-2">{{ isLoginMode ? t('login.new.enterSystem') : t('login.new.createAccount') }} <ArrowRight :size="16" /></span>
             </button>
          </form>

          <div class="text-center text-base text-slate-500 dark:text-zinc-400">
             {{ isLoginMode ? t('login.new.noAccount') : t('login.new.hasAccount') }}
             <button class="ml-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-all min-h-[44px] inline-flex items-center" @click="toggleMode">
                {{ isLoginMode ? t('login.new.registerNow') : t('login.new.loginNow') }}
             </button>
          </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 8s var(--ease-snap) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.8s var(--ease-fluid);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  position: absolute; /* To prevent layout shift during exit */
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s var(--ease-fluid);
  max-height: 500px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s var(--ease-snap);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.entry-animation {
  animation: slideUpFade 0.7s var(--ease-fluid) forwards;
  opacity: 0;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(2rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
