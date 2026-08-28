import React from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'

interface Props {
  question: string
  directAnswer: string
  takeaways?: string[]
  children?: React.ReactNode
}

export default function AEOAnswerBox({ question, directAnswer, takeaways, children }: Props) {
  return (
    <article className="aeo-answer-box">
      <div className="aeo-header">
        <span className="aeo-badge">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Direct Answer</span>
        </span>
        <h2 className="aeo-question">{question}</h2>
      </div>

      <div className="aeo-direct-summary">
        <p className="aeo-direct-text">{directAnswer}</p>
      </div>

      {takeaways && takeaways.length > 0 && (
        <div className="aeo-takeaways-list">
          <div className="aeo-takeaways-title">Key Highlights:</div>
          <div className="aeo-takeaways-grid">
            {takeaways.map((point, i) => (
              <div key={i} className="aeo-takeaway-item">
                <CheckCircle2 className="aeo-check-icon" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {children && <div className="aeo-extra-content">{children}</div>}
    </article>
  )
}
