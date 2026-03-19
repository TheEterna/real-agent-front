import type { Component } from 'vue'

type UIComponentRegistry = Record<string, () => Promise<Component>>

export const UI_COMPONENT_REGISTRY: UIComponentRegistry = {
  // 表单输入类
  form:         () => import('./input/UIForm.vue').then(m => m.default),
  text_input:   () => import('./input/UITextInput.vue').then(m => m.default),
  select:       () => import('./input/UISelect.vue').then(m => m.default),
  multi_select: () => import('./input/UIMultiSelect.vue').then(m => m.default),
  radio:        () => import('./input/UIRadio.vue').then(m => m.default),
  checkbox:     () => import('./input/UICheckbox.vue').then(m => m.default),
  slider:       () => import('./input/UISlider.vue').then(m => m.default),
  date_picker:  () => import('./input/UIDatePicker.vue').then(m => m.default),
  file_upload:  () => import('./input/UIFileUpload.vue').then(m => m.default),
  confirm:      () => import('./input/UIConfirm.vue').then(m => m.default),

  // 数据展示类
  table:        () => import('./display/UITable.vue').then(m => m.default),
  card:         () => import('./display/UICard.vue').then(m => m.default),
  card_list:    () => import('./display/UICardList.vue').then(m => m.default),
  key_value:    () => import('./display/UIKeyValue.vue').then(m => m.default),
  code:         () => import('./display/UICode.vue').then(m => m.default),
  image:        () => import('./display/UIImage.vue').then(m => m.default),
  markdown:     () => import('./display/UIMarkdown.vue').then(m => m.default),
  progress:     () => import('./display/UIProgress.vue').then(m => m.default),

  // 图表类
  bar_chart:    () => import('./chart/UIBarChart.vue').then(m => m.default),
  line_chart:   () => import('./chart/UILineChart.vue').then(m => m.default),
  pie_chart:    () => import('./chart/UIPieChart.vue').then(m => m.default),
  radar_chart:  () => import('./chart/UIRadarChart.vue').then(m => m.default),
  stat_card:    () => import('./chart/UIStatCard.vue').then(m => m.default),

  // 复合/特殊类
  steps:        () => import('./composite/UISteps.vue').then(m => m.default),
  tabs:         () => import('./composite/UITabs.vue').then(m => m.default),
  collapse:     () => import('./composite/UICollapse.vue').then(m => m.default),
  alert:        () => import('./composite/UIAlert.vue').then(m => m.default),
}
