'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellSlash, Lightning, Target, ShieldWarning, ChartBar, Info } from '@phosphor-icons/react'
import { usePushNotifications } from '@/app/hooks/usePushNotifications'
import { useSession } from 'next-auth/react'

interface NotifPrefs {
  pushSignalAlerts: boolean
  pushTpAlerts: boolean
  pushSlAlerts: boolean
  pushDailyReport: boolean
}

const STORAGE_KEY = 'alpha_push_prefs'

const defaultPrefs: NotifPrefs = {
  pushSignalAlerts: true,
  pushTpAlerts: true,
  pushSlAlerts: true,
  pushDailyReport: true,
}

export default function PushNotificationSettings() {
  const { state, isIOS, iosSupported, subscribe, unsubscribe } = usePushNotifications()
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs)
  const [saving, setSaving] = useState(false)

  // Load preferences
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((data) => {
          setPrefs({
            pushSignalAlerts: data.pushSignalAlerts ?? true,
            pushTpAlerts: data.pushTpAlerts ?? true,
            pushSlAlerts: data.pushSlAlerts ?? true,
            pushDailyReport: data.pushDailyReport ?? true,
          })
        })
        .catch(() => {})
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setPrefs(JSON.parse(stored))
      } catch {
        // ignore
      }
    }
  }, [isLoggedIn])

  const updatePref = useCallback(
    async (key: keyof NotifPrefs, value: boolean) => {
      const updated = { ...prefs, [key]: value }
      setPrefs(updated)

      if (isLoggedIn) {
        setSaving(true)
        try {
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: value }),
          })
        } catch {
          // revert on error
          setPrefs(prefs)
        } finally {
          setSaving(false)
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
    },
    [prefs, isLoggedIn],
  )

  const toggleItems: { key: keyof NotifPrefs; label: string; desc: string; icon: typeof Bell }[] = [
    { key: 'pushSignalAlerts', label: 'Signal Alerts', desc: 'New BUY/SELL signals', icon: Lightning },
    { key: 'pushTpAlerts', label: 'TP Hit Alerts', desc: 'Take-profit target reached', icon: Target },
    { key: 'pushSlAlerts', label: 'SL Hit Alerts', desc: 'Stop-loss triggered', icon: ShieldWarning },
    { key: 'pushDailyReport', label: 'Daily Report', desc: 'Daily accuracy summary', icon: ChartBar },
  ]

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bell size={18} className="text-emerald-400" weight="fill" />
        <h3 className="text-sm font-semibold text-white">Push Notifications</h3>
        {saving && <span className="text-[10px] text-zinc-500 ml-auto">Saving...</span>}
      </div>

      {/* iOS feature detection message */}
      {isIOS && !iosSupported && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300/80">
            Web push requires iOS 16.4+. Update your device to enable push notifications.
          </p>
        </div>
      )}

      {/* Subscription toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state === 'subscribed' ? (
            <Bell size={16} className="text-emerald-400" weight="fill" />
          ) : (
            <BellSlash size={16} className="text-zinc-500" />
          )}
          <span className="text-xs text-zinc-300">
            {state === 'subscribed' ? 'Enabled' : state === 'denied' ? 'Blocked by browser' : state === 'unsupported' ? 'Not supported' : 'Disabled'}
          </span>
        </div>
        <button
          onClick={state === 'subscribed' ? unsubscribe : subscribe}
          disabled={state === 'loading' || state === 'unsupported' || state === 'denied'}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            state === 'subscribed'
              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              : state === 'denied' || state === 'unsupported'
                ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {state === 'loading' ? 'Loading...' : state === 'subscribed' ? 'Disable' : 'Enable'}
        </button>
      </div>

      {state === 'denied' && (
        <p className="text-[10px] text-zinc-500">
          Notifications blocked. Reset in browser settings.
        </p>
      )}

      {/* Per-type toggles */}
      {state === 'subscribed' && (
        <div className="space-y-2 pt-1 border-t border-white/5">
          {toggleItems.map(({ key, label, desc, icon: Icon }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                <div>
                  <span className="text-xs text-zinc-200">{label}</span>
                  <p className="text-[10px] text-zinc-500">{desc}</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => updatePref(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 rounded-full bg-zinc-700 peer-checked:bg-emerald-500/40 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-zinc-400 peer-checked:bg-emerald-400 peer-checked:translate-x-3.5 transition-all" />
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
