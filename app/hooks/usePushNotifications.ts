'use client'

import { useState, useEffect, useCallback } from 'react'

type SubscriptionState = 'unsupported' | 'prompt' | 'subscribed' | 'denied' | 'loading'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// iOS Safari detection: supports web push from iOS 16.4+
function getIOSVersion(): number | null {
  const match = navigator.userAgent.match(/OS (\d+)_/)
  if (!match) return null
  return parseInt(match[1], 10)
}

export function usePushNotifications() {
  const [state, setState] = useState<SubscriptionState>('loading')
  const [isIOS, setIsIOS] = useState(false)
  const [iosVersion, setIosVersion] = useState<number | null>(null)

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)
    if (ios) setIosVersion(getIOSVersion())

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    // Check existing subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setState('subscribed')
        } else {
          const perm = Notification.permission
          setState(perm === 'denied' ? 'denied' : 'prompt')
        }
      })
    })
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    setState('loading')

    try {
      const reg = await navigator.serviceWorker.ready

      // Get VAPID public key from server
      const vapidRes = await fetch('/api/push/vapid')
      if (!vapidRes.ok) {
        setState('prompt')
        return false
      }
      const { publicKey } = await vapidRes.json()

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      })

      // Send subscription to server
      const subJson = subscription.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      })

      if (res.ok) {
        setState('subscribed')
        return true
      }

      setState('prompt')
      return false
    } catch {
      const perm = Notification.permission
      setState(perm === 'denied' ? 'denied' : 'prompt')
      return false
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setState('prompt')
        return true
      }

      // Unsubscribe from browser
      await sub.unsubscribe()

      // Remove from server
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })

      setState('prompt')

      // Clear badge
      if ('clearAppBadge' in navigator) {
        (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {})
      }

      return true
    } catch {
      return false
    }
  }, [])

  return {
    state,
    isIOS,
    iosVersion,
    iosSupported: !isIOS || (iosVersion !== null && iosVersion >= 16),
    subscribe,
    unsubscribe,
  }
}
