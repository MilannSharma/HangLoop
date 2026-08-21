import { GITHUB_ANDROID_APK, GITHUB_IOS_ZIP } from '../config'
import { Smartphone, Apple, Download, CheckCircle2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function DownloadModal({ open, onClose }: Props) {
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
    <div className={`modal-backdrop${open ? ' active' : ''}`} id="download-modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3>📲 Download Hangloop App</h3>
            <p>Select your platform to get started:</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* Apple / iPhone */}
          <div className="download-opt-card">
            <div className="download-opt-header">
              <div className="download-opt-icon">
                <Apple className="w-6 h-6 text-[#E1E0CC]" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="download-opt-title">Apple / iPhone (iOS)</div>
                <div className="download-opt-sub">iOS 15+ &bull; Progressive Web App / Standalone</div>
              </div>
            </div>
            <p className="download-opt-desc">
              On iPhone open Safari &gt; Share &gt; <strong>Add to Home Screen</strong>, or download the standalone package.
            </p>
            <button className="btn btn-ghost btn-full" onClick={triggerIos}>
              <Download className="w-4 h-4" />
              <span>Download for iPhone (ZIP)</span>
            </button>
          </div>

          {/* Android APK */}
          <div className="download-opt-card featured">
            <div className="download-opt-header">
              <div className="download-opt-icon featured-icon">
                <Smartphone className="w-6 h-6 text-[#E1E0CC]" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="download-opt-title">Android (Official APK)</div>
                <div className="download-opt-sub">v1.0.0 &bull; Size: 68.6 MB &bull; Android 7.0+</div>
              </div>
            </div>
            <p className="download-opt-desc">
              Direct standalone APK with continuous background audio play and lock screen media controls.
            </p>
            <button className="btn btn-gold btn-full" onClick={triggerAndroid}>
              <Download className="w-4 h-4" />
              <span>Download Official APK</span>
            </button>
            <div className="download-badge-row">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Direct install &bull; Verified safe build</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
