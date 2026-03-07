// API configuration — reads from .env via Vite's import.meta.env

export const API_CONFIG = {
    gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    },
    shazam: {
        apiKey: import.meta.env.VITE_RAPIDAPI_KEY || '',
        baseUrl: 'https://shazam.p.rapidapi.com',
        host: 'shazam.p.rapidapi.com',
    },
} as const

export function isApiConfigured(service: 'gemini' | 'shazam'): boolean {
    const key = API_CONFIG[service].apiKey
    return key.length > 0 && !key.startsWith('your_')
}
