export interface PlaygroundApp {
  id: string
  name: string
  description: string
  icon: string
  creator: string
  route?: string
  tags?: string[]
  comingSoon?: boolean
}

export interface FilterTag {
  label: string
  value: string
}
