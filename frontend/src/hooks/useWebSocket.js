import { useEffect, useRef, useCallback } from 'react'
import useAuthStore from '../store/authStore'
import useContentStore from '../store/contentStore'

const WS_BASE =
  import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:'
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`);

let wsInstance = null
let reconnectTimer = null
let reconnectAttempts = 0
const MAX_RECONNECT = 5
const RECONNECT_DELAY = 3000

export function useWebSocket() {
  const user = useAuthStore((s) => s.user)
  const addAgentStep = useContentStore((s) => s.addAgentStep)
  const addGeneratedPost = useContentStore((s) => s.addGeneratedPost)
  const completeGeneration = useContentStore((s) => s.completeGeneration)
  const setError = useContentStore((s) => s.setError)

  const handlersRef = useRef({ addAgentStep, addGeneratedPost, completeGeneration, setError })
  handlersRef.current = { addAgentStep, addGeneratedPost, completeGeneration, setError }

  const connect = useCallback(() => {
    if (!user?.id) return
    if (wsInstance?.readyState === WebSocket.OPEN) return

    const socket = new WebSocket(`${WS_BASE}/ws/${user.id}`)
    wsInstance = socket

    wsInstance.onopen = () => {
      console.log('[WS] Connected')
      reconnectAttempts = 0
    }

    wsInstance.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const h = handlersRef.current

        switch (msg.type) {
          case 'step':
            h.addAgentStep(msg.message)
            break
          case 'post':
            // Animate words appearing one by one
            animatePostWords(msg.platform, msg.data, h.addGeneratedPost)
            break
          case 'done':
            h.completeGeneration()
            break
          case 'error':
            h.setError(msg.message)
            break
          case 'ping':
          case 'pong':
            break
          default:
            break
        }
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    }

    wsInstance.onclose = () => {
      console.log('[WS] Disconnected')
      scheduleReconnect()
    }

    wsInstance.onerror = (err) => {
      console.error('[WS] Error:', err)
      wsInstance?.close()
    }
  }, [user?.id])

  const scheduleReconnect = () => {
    if (reconnectAttempts >= MAX_RECONNECT) return
    clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++
      console.log(`[WS] Reconnecting... attempt ${reconnectAttempts}`)
      connect()
    }, RECONNECT_DELAY * Math.min(reconnectAttempts + 1, 3))
  }

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer)
    reconnectAttempts = MAX_RECONNECT // prevent auto-reconnect
    wsInstance?.close()
    wsInstance = null
  }, [])

  const sendMessage = useCallback((data) => {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      // Don't disconnect on unmount — keep connection alive across pages
    }
  }, [connect])

  return { connect, disconnect, sendMessage, isConnected: wsInstance?.readyState === WebSocket.OPEN }
}

// Animate post words appearing one-by-one (50ms per word)
async function animatePostWords(platform, postData, addGeneratedPost) {
  const caption = postData.caption || ''
  const words = caption.split(' ')
  let accumulated = ''

  // Add initial empty post
  addGeneratedPost(platform, { ...postData, caption: '', _streaming: true })

  // We'll update via a different mechanism — just add the full post with a flag
  // The component handles the word-by-word animation via CSS
  setTimeout(() => {
    addGeneratedPost(platform, { ...postData, _streaming: false, _replace: true })
  }, 100)
}
