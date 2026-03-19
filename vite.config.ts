import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'node:path'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
// import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default defineConfig({
    plugins: [
        tailwindcss(),
        // Storybook 不兼容 vite-plugin-vue-devtools，运行 storybook 时自动跳过
        !process.argv[1]?.includes('storybook') && vueDevTools(),
        vue(),
        // monacoEditorPlugin({
        //     languages: ['json', 'javascript', 'typescript', 'html', 'css', 'java', 'python'],
        //     // 可选：指定需要支持的主题
        //     themes: ['vs-dark', 'vs-light']
        // }),
        // Lobe Icons - AI/LLM 品牌图标
        // @see https://icons.lobehub.com
        Icons({
            compiler: 'vue3',
            customCollections: {
                // 从 @lobehub/icons-static-svg 加载图标
                'lobe': FileSystemIconLoader(
                    resolve(__dirname, 'node_modules/@lobehub/icons-static-svg/icons'),
                    svg => svg.replace(/^<svg /, '<svg fill="currentColor" ')
                ),
            },
        }),
    ].filter(Boolean) as any,
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@repo/shadcn-vue/lib/utils': resolve(__dirname, './src/lib/utils.ts')
        }
    },
    server: {
        port: 5173,
        open: true,
        proxy: {
            '/api': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
                changeOrigin: true,
                // 🔑 关键配置：禁用代理缓冲，确保 SSE 流式响应实时传输
                // 如果不配置，http-proxy 会缓冲整个响应后再转发，导致"伪流式"
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes, req) => {
                        // 检测 SSE 响应（text/event-stream）
                        const contentType = proxyRes.headers['content-type'] || ''
                        if (contentType.includes('text/event-stream')) {
                            // 禁用代理缓冲
                            proxyRes.headers['X-Accel-Buffering'] = 'no'
                            proxyRes.headers['Cache-Control'] = 'no-cache, no-transform'
                        }
                    })
                }
            },
            // Proxy OpenAI-compatible /v1 endpoint (used by AI SDK for knowledge chat)
            '/v1': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        const contentType = proxyRes.headers['content-type'] || ''
                        if (contentType.includes('text/event-stream')) {
                            proxyRes.headers['X-Accel-Buffering'] = 'no'
                            proxyRes.headers['Cache-Control'] = 'no-cache, no-transform'
                        }
                    })
                }
            },
            // Proxy WebSocket for realtime voice stream to backend
            '/ws': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
                changeOrigin: true,
                ws: true
            }
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                // 自动注入全局变量文件（注意路径要正确）
                additionalData: `@use "@/styles/variables.scss" as *;`,
                // 注：如果是 Windows 系统，路径分隔符用 \\，如：
                // additionalData: `@import "@\\styles\\variables.scss";`,
            },
        },
    },
    optimizeDeps: {
        exclude: ['monaco-editor']
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-markdown': ['markdown-it', 'mermaid', 'katex'],
                    'vendor-flow': ['@vue-flow/core', 'dagre'],
                    'vendor-editor': ['@tiptap/starter-kit', '@tiptap/vue-3'],
                }
            }
        },
        chunkSizeWarningLimit: 500,
        sourcemap: false
    },
    worker: { format: 'es' }
})