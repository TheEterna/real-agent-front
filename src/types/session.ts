import type { Component } from "vue";

export interface Session {
    id: string
    title: string
    type: AgentType
    createdTime: Date,
    updatedTime: Date,
    isPin?: boolean
}

/**
 * Session Value Object (后端返回的会话数据)
 * 对应后端的 SessionVO.java
 */
export interface SessionVO {
    id: string
    title: string
    type: string
    createdTime: string  // ISO 8601 格式
    updatedTime: string  // ISO 8601 格式
    isPin?: boolean
}

export enum AgentType {
    VoloAI = 'volo_ai',
}

