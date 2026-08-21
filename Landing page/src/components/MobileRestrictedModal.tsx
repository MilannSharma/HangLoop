import React from 'react'
import { Smartphone, Apple, Download, AlertTriangle, ShieldAlert } from 'lucide-react'
import { GITHUB_ANDROID_APK, GITHUB_IOS_ZIP } from '../config'

interface Props {
  open: boolean
  onClose?: () => void
}

export default function MobileRestrictedModal({ open, onClose }: Props) {
  const triggerAndroid = () => {
    const link = document.createElement('a')
    link.href = GITHUB_ANDROID_APK
    link.download = 'hangloop-v1.0.0.apk'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const triggerIos = () => {
    const link = document.createElement('a')
    link.href = GITHUB_IOS_ZIP
    link.download = 'hangloop-v1.0.0-ios.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`modal-backdrop${open ? ' active' : ''}`} id="mobile-restricted-modal" onClick={e => { if (e.target === e.currentTarget && onClose) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 480, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        
        {/* Header with Warning Accent */}
        <div className="modal-header" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#EF4444] flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="modal-title-wrap">
              <h3 style={{ color: '#EF4444', fontSize: '1.15rem' }}>Mobile App Required</h3>
              <p>Mobile web browser access restricted</p>
            </div>
          </div>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          )}
        </div>

        <div className="modal-body">
          <div className="mobile-restriction-notice">
            <p className="mobile-restriction-text">
              Hangloop is engineered for <strong>real-time zero-lag audio synchronization</strong> and <strong>continuous background playback</strong> when your phone is locked.
            </p>
            <p className="mobile-restriction-text" style={{ marginTop: 10, color: 'var(--prisma-cream)' }}>
              Mobile browsers do not support background synchronized streaming. To login and join live rooms, please download the official Hangloop mobile app.
            </p>
          </div>

          <div className="mobile-dl-options-wrap">
            {/* Android Official APK */}
            <div className="download-opt-card featured" style={{ margin: 0 }}>
              <div className="download-opt-header">
                <div className="download-opt-icon featured-icon">
                  <Smartphone className="w-5 h-5 text-[#E1E0CC]" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="download-opt-title">Official Android App (APK)</div>
                  <div className="download-opt-sub">Background Audio Play &bull; Android 7.0+</div>
                </div>
              </div>
              <button className="btn btn-gold btn-full mt-2" onClick={triggerAndroid}>
                <Download className="w-4 h-4" />
                <span>Download Android APK (68 MB)</span>
              </button>
            </div>

            {/* iPhone / iOS */}
            <div className="download-opt-card" style={{ margin: 0 }}>
              <div className="download-opt-header">
                <div className="download-opt-icon">
                  <Apple className="w-5 h-5 text-[#E1E0CC]" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="download-opt-title">iPhone / iOS App</div>
                  <div className="download-opt-sub">iOS 15+ &bull; Standalone Package</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-full mt-2" onClick={triggerIos}>
                <Download className="w-4 h-4" />
                <span>Download for iOS (ZIP)</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
