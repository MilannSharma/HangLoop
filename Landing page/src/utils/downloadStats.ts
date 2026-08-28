import { useState, useEffect } from 'react'

const APK_STORAGE_KEY = 'hangloop_apk_dl_count'
const IOS_STORAGE_KEY = 'hangloop_ios_dl_count'

// Starting counts from 100 as requested
const DEFAULT_APK_COUNT = 138
const DEFAULT_IOS_COUNT = 114

export function getStoredApkCount(): number {
  try {
    const val = localStorage.getItem(APK_STORAGE_KEY)
    if (!val) {
      localStorage.setItem(APK_STORAGE_KEY, String(DEFAULT_APK_COUNT))
      return DEFAULT_APK_COUNT
    }
    const num = parseInt(val, 10)
    return isNaN(num) || num < 100 ? DEFAULT_APK_COUNT : num
  } catch {
    return DEFAULT_APK_COUNT
  }
}

export function getStoredIosCount(): number {
  try {
    const val = localStorage.getItem(IOS_STORAGE_KEY)
    if (!val) {
      localStorage.setItem(IOS_STORAGE_KEY, String(DEFAULT_IOS_COUNT))
      return DEFAULT_IOS_COUNT
    }
    const num = parseInt(val, 10)
    return isNaN(num) || num < 100 ? DEFAULT_IOS_COUNT : num
  } catch {
    return DEFAULT_IOS_COUNT
  }
}

export function incrementApkDownload(): number {
  try {
    const current = getStoredApkCount()
    const updated = current + 1
    localStorage.setItem(APK_STORAGE_KEY, String(updated))
    window.dispatchEvent(new Event('hangloop_dl_update'))
    return updated
  } catch {
    return DEFAULT_APK_COUNT + 1
  }
}

export function incrementIosDownload(): number {
  try {
    const current = getStoredIosCount()
    const updated = current + 1
    localStorage.setItem(IOS_STORAGE_KEY, String(updated))
    window.dispatchEvent(new Event('hangloop_dl_update'))
    return updated
  } catch {
    return DEFAULT_IOS_COUNT + 1
  }
}

export function useDownloadCounts() {
  const [apkCount, setApkCount] = useState<number>(getStoredApkCount)
  const [iosCount, setIosCount] = useState<number>(getStoredIosCount)

  useEffect(() => {
    const handleUpdate = () => {
      setApkCount(getStoredApkCount())
      setIosCount(getStoredIosCount())
    }

    window.addEventListener('hangloop_dl_update', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('hangloop_dl_update', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return { apkCount, iosCount, incrementApkDownload, incrementIosDownload }
}
