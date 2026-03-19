/**
 * Mock handler: Memory Album
 *
 * Intercepts memory album API requests and returns rich mock data with AI analysis.
 * This covers the MEMORY ALBUM feature (photo/video memories), not the AI memory system.
 *
 * @author Mock
 * @since 2026-03-19
 */

import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId } from '../shared'

// ==================== Types ====================

interface MemoryAlbum {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  width?: number
  height?: number
  aiCaption: string
  aiScene: string
  aiTags: string[]
  aiColors: string[]
  aiEmotions: Record<string, number>
  takenAt?: string
  locationName?: string
  userTitle?: string
  userDescription?: string
  createdTime: string
}

// ==================== Mock Data ====================

const MOCK_MEMORIES: MemoryAlbum[] = [
  {
    id: 'mem-album-001',
    fileName: 'cherry_blossom.jpg',
    fileUrl: 'https://picsum.photos/seed/cherry_blossom/1200/800',
    mimeType: 'image/jpeg',
    width: 1200,
    height: 800,
    aiCaption: '春日午后，粉色樱花在微风中轻轻摇曳，阳光透过花瓣洒落斑驳的光影',
    aiScene: '公园/花园',
    aiTags: ['樱花', '春天', '自然', '粉色', '阳光'],
    aiColors: ['#FFB7C5', '#90EE90', '#87CEEB'],
    aiEmotions: { joy: 0.85, serenity: 0.72, nostalgia: 0.45 },
    takenAt: '2026-03-15T14:30:00Z',
    locationName: '上海世纪公园',
    userTitle: '三月樱花季',
    userDescription: '今年的樱花开得格外好',
    createdTime: '2026-03-15T15:00:00Z',
  },
  {
    id: 'mem-album-002',
    fileName: 'team_dinner.jpg',
    fileUrl: 'https://picsum.photos/seed/team_dinner/1600/1067',
    mimeType: 'image/jpeg',
    width: 1600,
    height: 1067,
    aiCaption: '欢乐的团队聚餐，八个人围坐在圆桌旁，桌上摆满了丰盛的川菜',
    aiScene: '餐厅',
    aiTags: ['聚餐', '团队', '美食', '欢乐', '川菜'],
    aiColors: ['#E8A87C', '#D4AF37', '#8B4513'],
    aiEmotions: { joy: 0.92, excitement: 0.65, warmth: 0.58 },
    takenAt: '2026-03-10T19:15:00Z',
    locationName: '成都印象川菜馆',
    userTitle: '项目上线庆功宴',
    createdTime: '2026-03-10T20:30:00Z',
  },
  {
    id: 'mem-album-003',
    fileName: 'cat_sleeping.jpg',
    fileUrl: 'https://picsum.photos/seed/cat_sleeping/800/1200',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
    aiCaption: '橘猫蜷缩在阳光下的窗台上，安静地打着盹，毛发被阳光染成金色',
    aiScene: '室内/窗台',
    aiTags: ['猫', '橘猫', '午睡', '阳光', '温馨'],
    aiColors: ['#F4A460', '#FFF8DC', '#FFD700'],
    aiEmotions: { serenity: 0.95, warmth: 0.88, tenderness: 0.72 },
    takenAt: '2026-02-28T13:45:00Z',
    userTitle: '小橘的午后',
    userDescription: '每天下午两点准时占领窗台',
    createdTime: '2026-02-28T14:00:00Z',
  },
  {
    id: 'mem-album-004',
    fileName: 'coding_night.jpg',
    fileUrl: 'https://picsum.photos/seed/coding_night/1400/933',
    mimeType: 'image/png',
    width: 1400,
    height: 933,
    aiCaption: '深夜的屏幕散发着柔和的蓝光，桌上咖啡杯旁散落着几张便利贴，代码在屏幕上流淌',
    aiScene: '书房/工作室',
    aiTags: ['编程', '深夜', '代码', '咖啡', '专注'],
    aiColors: ['#1E3A5F', '#00D4FF', '#2D2D2D', '#C19A6B'],
    aiEmotions: { focus: 0.88, determination: 0.76, solitude: 0.52 },
    takenAt: '2026-02-20T23:30:00Z',
    locationName: '家',
    createdTime: '2026-02-21T00:15:00Z',
  },
  {
    id: 'mem-album-005',
    fileName: 'sunset_beach.jpg',
    fileUrl: 'https://picsum.photos/seed/sunset_beach/1920/1080',
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    aiCaption: '金色夕阳沉入海平线，天空被染成渐变的橘红与紫罗兰色，浪花轻吻沙滩',
    aiScene: '海滩/海边',
    aiTags: ['日落', '海滩', '大海', '黄昏', '浪花', '天空'],
    aiColors: ['#FF6B35', '#9B59B6', '#F39C12', '#2980B9'],
    aiEmotions: { awe: 0.91, serenity: 0.87, nostalgia: 0.63, romance: 0.48 },
    takenAt: '2026-02-14T17:45:00Z',
    locationName: '三亚亚龙湾',
    userTitle: '情人节日落',
    userDescription: '此生见过最美的日落',
    createdTime: '2026-02-14T18:30:00Z',
  },
  {
    id: 'mem-album-006',
    fileName: 'coffee_shop.jpg',
    fileUrl: 'https://picsum.photos/seed/coffee_shop/1067/1600',
    mimeType: 'image/webp',
    width: 1067,
    height: 1600,
    aiCaption: '咖啡馆角落的木桌上，拿铁拉花还未散去，笔记本电脑旁摊开着一本泛黄的书',
    aiScene: '咖啡馆',
    aiTags: ['咖啡', '拿铁', '阅读', '午后', '文艺'],
    aiColors: ['#6F4E37', '#F5F5DC', '#D2B48C'],
    aiEmotions: { calm: 0.82, contentment: 0.75, inspiration: 0.53 },
    takenAt: '2026-02-08T15:20:00Z',
    locationName: 'Seesaw Coffee 南京西路店',
    createdTime: '2026-02-08T15:45:00Z',
  },
  {
    id: 'mem-album-007',
    fileName: 'mountain_hike.jpg',
    fileUrl: 'https://picsum.photos/seed/mountain_hike/1600/900',
    mimeType: 'image/jpeg',
    width: 1600,
    height: 900,
    aiCaption: '站在山顶俯瞰云海，远处的山峰若隐若现，晨光穿过云层洒下万道金光',
    aiScene: '山顶/户外',
    aiTags: ['徒步', '登山', '云海', '日出', '自然', '壮观'],
    aiColors: ['#2E8B57', '#87CEEB', '#FFD700', '#708090'],
    aiEmotions: { awe: 0.94, accomplishment: 0.89, freedom: 0.81 },
    takenAt: '2026-01-28T06:15:00Z',
    locationName: '黄山光明顶',
    userTitle: '黄山之巅',
    userDescription: '凌晨三点出发，一切都值了',
    createdTime: '2026-01-28T08:00:00Z',
  },
  {
    id: 'mem-album-008',
    fileName: 'bookshelf.jpg',
    fileUrl: 'https://picsum.photos/seed/bookshelf/900/1200',
    mimeType: 'image/jpeg',
    width: 900,
    height: 1200,
    aiCaption: '满满当当的书架，技术书籍与文学作品交错排列，几本书侧放着露出彩色书签',
    aiScene: '书房',
    aiTags: ['书架', '阅读', '书籍', '知识', '文化'],
    aiColors: ['#8B4513', '#F0E68C', '#2F4F4F'],
    aiEmotions: { curiosity: 0.78, calm: 0.71, nostalgia: 0.42 },
    takenAt: '2026-01-20T10:00:00Z',
    createdTime: '2026-01-20T10:30:00Z',
  },
  {
    id: 'mem-album-009',
    fileName: 'city_night.jpg',
    fileUrl: 'https://picsum.photos/seed/city_night/1920/1280',
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1280,
    aiCaption: '璀璨的城市夜景从高楼俯瞰而下，万家灯火如繁星坠入人间，车流画出光的河流',
    aiScene: '城市高楼/夜景',
    aiTags: ['夜景', '城市', '灯光', '都市', '高楼', '车流'],
    aiColors: ['#1C1C1C', '#FFD700', '#FF4500', '#4169E1'],
    aiEmotions: { awe: 0.86, excitement: 0.72, solitude: 0.38 },
    takenAt: '2026-01-15T21:00:00Z',
    locationName: '上海环球金融中心观光厅',
    userTitle: '魔都不夜城',
    createdTime: '2026-01-15T21:30:00Z',
  },
  {
    id: 'mem-album-010',
    fileName: 'graduation.jpg',
    fileUrl: 'https://picsum.photos/seed/graduation/1400/1050',
    mimeType: 'image/jpeg',
    width: 1400,
    height: 1050,
    aiCaption: '毕业典礼上抛起学士帽的瞬间，蓝天下黑色方帽如鸟群般飞舞，笑容定格在阳光里',
    aiScene: '校园/毕业典礼',
    aiTags: ['毕业', '学士帽', '校园', '青春', '纪念'],
    aiColors: ['#000000', '#4169E1', '#87CEEB', '#FFD700'],
    aiEmotions: { joy: 0.96, pride: 0.91, nostalgia: 0.85, bittersweet: 0.67 },
    takenAt: '2025-06-28T10:30:00Z',
    locationName: '复旦大学正大体育馆',
    userTitle: '毕业快乐',
    userDescription: '四年时光，一瞬而过',
    createdTime: '2025-06-28T12:00:00Z',
  },
  {
    id: 'mem-album-011',
    fileName: 'cooking.jpg',
    fileUrl: 'https://picsum.photos/seed/cooking/1200/1600',
    mimeType: 'image/webp',
    width: 1200,
    height: 1600,
    aiCaption: '厨房里热气腾腾，锅中的番茄炒蛋色泽鲜亮，砧板上还留着切好的葱花',
    aiScene: '厨房',
    aiTags: ['下厨', '美食', '番茄炒蛋', '烹饪', '家常菜'],
    aiColors: ['#FF6347', '#FFD700', '#228B22'],
    aiEmotions: { warmth: 0.84, satisfaction: 0.77, comfort: 0.69 },
    takenAt: '2026-01-05T18:30:00Z',
    locationName: '家',
    userDescription: '第一次做饭给自己吃，居然还不错',
    createdTime: '2026-01-05T19:00:00Z',
  },
  {
    id: 'mem-album-012',
    fileName: 'workspace.jpg',
    fileUrl: 'https://picsum.photos/seed/workspace/1600/1067',
    mimeType: 'image/png',
    width: 1600,
    height: 1067,
    aiCaption: '整洁的工位上双屏显示器并排，机械键盘旁边放着一盆多肉植物，桌面收纳井然有序',
    aiScene: '办公室/工位',
    aiTags: ['工位', '办公', '整洁', '双屏', '多肉', '键盘'],
    aiColors: ['#F5F5F5', '#2D2D2D', '#6B8E23', '#C0C0C0'],
    aiEmotions: { focus: 0.76, satisfaction: 0.68, calm: 0.62 },
    takenAt: '2025-12-20T09:00:00Z',
    userTitle: '我的工位 2.0',
    userDescription: '年底大扫除后的成果',
    createdTime: '2025-12-20T09:30:00Z',
  },
  {
    id: 'mem-album-013',
    fileName: 'concert.jpg',
    fileUrl: 'https://picsum.photos/seed/concert/1400/787',
    mimeType: 'image/jpeg',
    width: 1400,
    height: 787,
    aiCaption: '音乐会现场灯光璀璨，舞台上光柱交错，观众举起手臂随节拍摇摆，空气中弥漫着热情',
    aiScene: '演唱会/音乐厅',
    aiTags: ['音乐会', '演唱会', '灯光', '舞台', '热情'],
    aiColors: ['#FF1493', '#8A2BE2', '#00CED1', '#1C1C1C'],
    aiEmotions: { excitement: 0.95, joy: 0.88, euphoria: 0.82 },
    takenAt: '2025-12-31T22:00:00Z',
    locationName: '上海梅赛德斯-奔驰文化中心',
    userTitle: '跨年演唱会',
    userDescription: '五月天的跨年，永远的青春',
    createdTime: '2026-01-01T01:00:00Z',
  },
  {
    id: 'mem-album-014',
    fileName: 'snow_scene.jpg',
    fileUrl: 'https://picsum.photos/seed/snow_scene/1800/1200',
    mimeType: 'image/jpeg',
    width: 1800,
    height: 1200,
    aiCaption: '银装素裹的世界，雪花纷飞中古朴的木屋顶覆盖着厚厚的积雪，脚印延伸向远方',
    aiScene: '雪景/冬日户外',
    aiTags: ['雪景', '冬天', '木屋', '纯净', '白色', '安静'],
    aiColors: ['#FFFAFA', '#B0C4DE', '#8B7355'],
    aiEmotions: { serenity: 0.90, awe: 0.75, nostalgia: 0.58, solitude: 0.43 },
    takenAt: '2025-12-25T08:00:00Z',
    locationName: '北海道小樽',
    userTitle: '白色圣诞',
    createdTime: '2025-12-25T10:00:00Z',
  },
  {
    id: 'mem-album-015',
    fileName: 'birthday_cake.jpg',
    fileUrl: 'https://picsum.photos/seed/birthday_cake/1000/1000',
    mimeType: 'image/jpeg',
    width: 1000,
    height: 1000,
    aiCaption: '精致的生日蛋糕上插着闪烁的蜡烛，奶油玫瑰花环绕着巧克力字牌，烛光映照出笑脸',
    aiScene: '室内/生日派对',
    aiTags: ['生日', '蛋糕', '蜡烛', '庆祝', '甜品'],
    aiColors: ['#FFB6C1', '#FFDAB9', '#8B4513', '#FFF8DC'],
    aiEmotions: { joy: 0.93, gratitude: 0.81, warmth: 0.78, excitement: 0.65 },
    takenAt: '2025-11-18T19:00:00Z',
    locationName: '家',
    userTitle: '26岁生日快乐',
    userDescription: '朋友们偷偷准备的惊喜',
    createdTime: '2025-11-18T20:00:00Z',
  },
  {
    id: 'mem-album-016',
    fileName: 'morning_run.jpg',
    fileUrl: 'https://picsum.photos/seed/morning_run/1600/1067',
    mimeType: 'image/webp',
    width: 1600,
    height: 1067,
    aiCaption: '清晨的跑道上雾气还未散尽，远处的天际线被朝霞染成粉橘色，运动鞋踏过湿润的塑胶跑道',
    aiScene: '公园跑道/户外',
    aiTags: ['晨跑', '运动', '清晨', '健康', '朝霞'],
    aiColors: ['#FF7F50', '#E6E6FA', '#3CB371'],
    aiEmotions: { vitality: 0.87, determination: 0.79, peace: 0.64 },
    takenAt: '2026-03-01T06:30:00Z',
    locationName: '世纪公园环湖步道',
    createdTime: '2026-03-01T07:00:00Z',
  },
  {
    id: 'mem-album-017',
    fileName: 'garden_flowers.jpg',
    fileUrl: 'https://picsum.photos/seed/garden_flowers/1200/900',
    mimeType: 'image/jpeg',
    width: 1200,
    height: 900,
    aiCaption: '花园里各色鲜花争相绽放，玫瑰与薰衣草交错成片，蝴蝶在花丛间翩翩起舞',
    aiScene: '花园/户外',
    aiTags: ['鲜花', '花园', '玫瑰', '薰衣草', '蝴蝶', '春天'],
    aiColors: ['#DC143C', '#E6E6FA', '#228B22', '#FFD700'],
    aiEmotions: { joy: 0.83, serenity: 0.79, wonder: 0.61 },
    takenAt: '2026-03-12T11:00:00Z',
    locationName: '上海辰山植物园',
    userTitle: '春日花园',
    createdTime: '2026-03-12T11:30:00Z',
  },
  {
    id: 'mem-album-018',
    fileName: 'travel_map.jpg',
    fileUrl: 'https://picsum.photos/seed/travel_map/1067/1600',
    mimeType: 'image/png',
    width: 1067,
    height: 1600,
    aiCaption: '桌上摊开的世界地图上标满了彩色图钉，护照和机票散落在旁，红线连接着去过的城市',
    aiScene: '室内/桌面',
    aiTags: ['旅行', '地图', '世界', '探索', '护照', '计划'],
    aiColors: ['#F5DEB3', '#CD853F', '#4169E1', '#DC143C'],
    aiEmotions: { excitement: 0.84, wanderlust: 0.92, anticipation: 0.77 },
    takenAt: '2026-01-10T16:00:00Z',
    userTitle: '2026旅行计划',
    userDescription: '今年目标：至少去三个新的国家',
    createdTime: '2026-01-10T16:30:00Z',
  },
  {
    id: 'mem-album-019',
    fileName: 'art_gallery.jpg',
    fileUrl: 'https://picsum.photos/seed/art_gallery/1500/1000',
    mimeType: 'image/jpeg',
    width: 1500,
    height: 1000,
    aiCaption: '美术馆洁白的墙面上挂着巨幅油画，观者独自伫立在画作前，光影营造出宁静的氛围',
    aiScene: '美术馆/展览',
    aiTags: ['美术馆', '艺术', '油画', '展览', '文化', '安静'],
    aiColors: ['#F5F5F5', '#4682B4', '#8B7355', '#2F2F2F'],
    aiEmotions: { contemplation: 0.88, inspiration: 0.76, serenity: 0.71, awe: 0.55 },
    takenAt: '2025-11-05T14:00:00Z',
    locationName: '上海龙美术馆西岸馆',
    userTitle: '周末看展',
    createdTime: '2025-11-05T15:00:00Z',
  },
  {
    id: 'mem-album-020',
    fileName: 'rainy_window.jpg',
    fileUrl: 'https://picsum.photos/seed/rainy_window/900/1350',
    mimeType: 'image/jpeg',
    width: 900,
    height: 1350,
    aiCaption: '雨滴沿着玻璃窗缓缓滑落，窗外的街景在水珠中模糊成印象派画作，室内暖黄灯光倒映其中',
    aiScene: '室内/窗边',
    aiTags: ['雨天', '窗户', '雨滴', '安静', '温馨', '朦胧'],
    aiColors: ['#708090', '#A9A9A9', '#FFD700', '#4682B4'],
    aiEmotions: { melancholy: 0.72, serenity: 0.68, nostalgia: 0.65, comfort: 0.54 },
    takenAt: '2025-10-22T16:30:00Z',
    userDescription: '喜欢下雨天待在室内的感觉',
    createdTime: '2025-10-22T17:00:00Z',
  },
  {
    id: 'mem-album-021',
    fileName: 'night_market.jpg',
    fileUrl: 'https://picsum.photos/seed/night_market/1400/933',
    mimeType: 'image/jpeg',
    width: 1400,
    height: 933,
    aiCaption: '夜市的烟火气息扑面而来，各色小吃摊位灯火通明，人群穿梭在热闹的巷弄中',
    aiScene: '夜市/街头',
    aiTags: ['夜市', '小吃', '烟火气', '热闹', '美食', '街头'],
    aiColors: ['#FF4500', '#FFD700', '#FF6347', '#2F2F2F'],
    aiEmotions: { joy: 0.82, excitement: 0.78, nostalgia: 0.56, warmth: 0.71 },
    takenAt: '2025-10-01T20:00:00Z',
    locationName: '台北士林夜市',
    userTitle: '国庆台湾行',
    userDescription: '蚵仔煎真的太好吃了',
    createdTime: '2025-10-01T21:00:00Z',
  },
  {
    id: 'mem-album-022',
    fileName: 'starry_sky.jpg',
    fileUrl: 'https://picsum.photos/seed/starry_sky/1920/1080',
    mimeType: 'image/png',
    width: 1920,
    height: 1080,
    aiCaption: '远离城市光污染的旷野上，银河横跨天际，繁星密布如钻石洒落在深蓝色的天幕上',
    aiScene: '户外/旷野/夜空',
    aiTags: ['星空', '银河', '夜晚', '天文', '旷野', '壮观'],
    aiColors: ['#191970', '#FFD700', '#E6E6FA', '#000033'],
    aiEmotions: { awe: 0.97, wonder: 0.93, serenity: 0.82, insignificance: 0.45 },
    takenAt: '2025-09-15T22:30:00Z',
    locationName: '青海茶卡盐湖',
    userTitle: '银河倒映',
    userDescription: '人生必须看一次的风景',
    createdTime: '2025-09-16T00:00:00Z',
  },
  {
    id: 'mem-album-023',
    fileName: 'old_alley.jpg',
    fileUrl: 'https://picsum.photos/seed/old_alley/800/1200',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
    aiCaption: '老弄堂里晾晒的衣物随风飘荡，斑驳的墙面上爬满了藤蔓，阳光从狭窄的缝隙中挤进来',
    aiScene: '弄堂/老街',
    aiTags: ['弄堂', '老街', '上海', '生活', '怀旧', '人文'],
    aiColors: ['#A0522D', '#8FBC8F', '#D2B48C'],
    aiEmotions: { nostalgia: 0.91, warmth: 0.65, melancholy: 0.48 },
    takenAt: '2025-11-30T15:00:00Z',
    locationName: '上海田子坊',
    createdTime: '2025-11-30T15:30:00Z',
  },
  {
    id: 'mem-album-024',
    fileName: 'autumn_leaves.jpg',
    fileUrl: 'https://picsum.photos/seed/autumn_leaves/1600/1067',
    mimeType: 'image/webp',
    width: 1600,
    height: 1067,
    aiCaption: '满地金黄的银杏叶铺成一条金色长毯，阳光穿透树冠洒下光斑，秋风送来淡淡的清香',
    aiScene: '公园/林荫道',
    aiTags: ['秋天', '银杏', '落叶', '金黄', '林荫道'],
    aiColors: ['#DAA520', '#CD853F', '#556B2F', '#87CEEB'],
    aiEmotions: { serenity: 0.86, nostalgia: 0.82, beauty: 0.78 },
    takenAt: '2025-11-10T10:30:00Z',
    locationName: '南京中山陵银杏大道',
    userTitle: '金色的秋天',
    createdTime: '2025-11-10T11:00:00Z',
  },
]

// ==================== Handler ====================

export default function memoryMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // POST /memories/upload → upload a memory photo/video
  if (method === 'post' && match('/memories/upload', url)) {
    const body = parseBody(config.data)
    const newMemory: MemoryAlbum = {
      id: mockId('mem-album'),
      fileName: body.fileName || 'uploaded_image.jpg',
      fileUrl: `https://picsum.photos/seed/${Date.now()}/1200/800`,
      mimeType: body.mimeType || 'image/jpeg',
      width: body.width || 1200,
      height: body.height || 800,
      aiCaption: '正在分析中的新上传照片，AI 将为您自动生成描述',
      aiScene: '待分析',
      aiTags: ['新上传'],
      aiColors: ['#808080'],
      aiEmotions: { neutral: 0.5 },
      takenAt: body.takenAt,
      locationName: body.locationName,
      userTitle: body.userTitle,
      userDescription: body.userDescription,
      createdTime: new Date().toISOString(),
    }
    return ok(newMemory)
  }

  // GET /memories/list?page=&pageSize= → paginated list
  if (method === 'get' && match('/memories/list', url)) {
    const params = new URLSearchParams(url.split('?')[1] || '')
    const page = parseInt(params.get('page') || '1', 10)
    const pageSize = parseInt(params.get('pageSize') || '10', 10)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paged = MOCK_MEMORIES.slice(start, end)
    return ok({
      records: paged,
      total: MOCK_MEMORIES.length,
      page,
      pageSize,
      totalPages: Math.ceil(MOCK_MEMORIES.length / pageSize),
    })
  }

  // POST /memories/search → search by AI tags/caption/scene
  if (method === 'post' && match('/memories/search', url)) {
    const body = parseBody(config.data)
    const query = (body.query || body.keyword || '').toLowerCase()
    if (!query) {
      return ok(MOCK_MEMORIES)
    }
    const filtered = MOCK_MEMORIES.filter((m) => {
      const inCaption = m.aiCaption.toLowerCase().includes(query)
      const inScene = m.aiScene.toLowerCase().includes(query)
      const inTags = m.aiTags.some((t) => t.toLowerCase().includes(query))
      const inTitle = (m.userTitle || '').toLowerCase().includes(query)
      const inDesc = (m.userDescription || '').toLowerCase().includes(query)
      const inLocation = (m.locationName || '').toLowerCase().includes(query)
      return inCaption || inScene || inTags || inTitle || inDesc || inLocation
    })
    return ok(filtered)
  }

  // DELETE /memories/:memoryId → delete a memory
  if (method === 'delete' && match('/memories/:memoryId', url)) {
    return ok(null)
  }

  return null
}
