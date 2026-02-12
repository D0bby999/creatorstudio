import type { CSSProperties } from 'react'
import type { SeoReport } from '../types/crawler-types'

export function SeoReportView({ report }: { report: SeoReport }) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <div style={styles.container}>
      {/* Score Overview */}
      <div style={styles.scoreSection}>
        <div
          style={{
            ...styles.scoreBadge,
            backgroundColor: getScoreColor(report.score)
          }}
        >
          <div style={styles.scoreValue}>{report.score}</div>
          <div style={styles.scoreLabel}>{getScoreLabel(report.score)}</div>
        </div>
      </div>

      {/* Title Analysis */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Title</h3>
        <div style={styles.fieldBox}>
          <div style={styles.fieldValue}>{report.title.value || 'No title'}</div>
          <div style={styles.fieldMeta}>
            <span style={report.title.optimal ? styles.metaGood : styles.metaWarning}>
              {report.title.length} characters
            </span>
            <span style={styles.metaInfo}>Optimal: 30-60 characters</span>
          </div>
        </div>
      </div>

      {/* Description Analysis */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Meta Description</h3>
        <div style={styles.fieldBox}>
          <div style={styles.fieldValue}>{report.description.value || 'No description'}</div>
          <div style={styles.fieldMeta}>
            <span style={report.description.optimal ? styles.metaGood : styles.metaWarning}>
              {report.description.length} characters
            </span>
            <span style={styles.metaInfo}>Optimal: 120-160 characters</span>
          </div>
        </div>
      </div>

      {/* Headings Structure */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Heading Structure</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>H1</div>
            <div style={report.headings.hasH1 ? styles.statValueGood : styles.statValueBad}>
              {report.headings.h1Count}
            </div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>H2</div>
            <div style={styles.statValue}>{report.headings.h2Count}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>H3</div>
            <div style={styles.statValue}>{report.headings.h3Count}</div>
          </div>
        </div>
        {!report.headings.hasH1 && (
          <div style={styles.warning}>Missing H1 heading (required for SEO)</div>
        )}
      </div>

      {/* Images Analysis */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Images</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total</div>
            <div style={styles.statValue}>{report.images.total}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>With Alt Text</div>
            <div style={styles.statValueGood}>{report.images.withAlt}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Missing Alt</div>
            <div style={styles.statValueBad}>{report.images.missingAlt}</div>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {report.keywords.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Top Keywords</h3>
          <div style={styles.keywordsList}>
            {report.keywords.slice(0, 10).map((kw, i) => (
              <div key={i} style={styles.keyword}>
                <span style={styles.keywordText}>{kw.word}</span>
                <span style={styles.keywordCount}>{kw.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {report.issues.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Issues Found ({report.issues.length})</h3>
          <ul style={styles.issuesList}>
            {report.issues.map((issue, i) => (
              <li key={i} style={styles.issueItem}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.footer}>
        Analyzed at {new Date(report.analyzedAt).toLocaleString()}
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  scoreSection: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px'
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    color: '#ffffff'
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    lineHeight: '1'
  },
  scoreLabel: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '8px'
  },
  section: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#111827'
  },
  fieldBox: {
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px'
  },
  fieldValue: {
    fontSize: '14px',
    marginBottom: '8px',
    wordBreak: 'break-word'
  },
  fieldMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px'
  },
  metaGood: {
    color: '#10b981',
    fontWeight: '600'
  },
  metaWarning: {
    color: '#f59e0b',
    fontWeight: '600'
  },
  metaInfo: {
    color: '#6b7280'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  statBox: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827'
  },
  statValueGood: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10b981'
  },
  statValueBad: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ef4444'
  },
  warning: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '4px',
    fontSize: '12px'
  },
  keywordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  keyword: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '16px',
    fontSize: '13px'
  },
  keywordText: {
    fontWeight: '500',
    color: '#1e40af'
  },
  keywordCount: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600'
  },
  issuesList: {
    margin: '0',
    paddingLeft: '20px',
    listStyle: 'disc'
  },
  issueItem: {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#dc2626'
  },
  footer: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '8px'
  }
}
