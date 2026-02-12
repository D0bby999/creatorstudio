import { useState, useEffect, type CSSProperties } from 'react'
import type { CrawlJob } from '../types/crawler-types'
import { SeoReportView } from './seo-report-view'
import { ScrapedContentView } from './scraped-content-view'

export function CrawlerDashboard() {
  const [url, setUrl] = useState('')
  const [jobType, setJobType] = useState<'url' | 'seo'>('seo')
  const [jobs, setJobs] = useState<CrawlJob[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/crawler')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: jobType })
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(prev => [data.job, ...prev])
        setUrl('')
        // Poll for updates
        setTimeout(() => fetchJobs(), 2000)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to create job'}`)
      }
    } catch (error) {
      console.error('Failed to submit job:', error)
      alert('Failed to submit job')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Crawler & Analytics</h1>
        <p style={styles.subtitle}>Scrape URLs and analyze SEO performance</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL (e.g., https://example.com)"
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.controls}>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="url"
                checked={jobType === 'url'}
                onChange={() => setJobType('url')}
                disabled={loading}
              />
              <span style={styles.radioText}>URL Scrape</span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="seo"
                checked={jobType === 'seo'}
                onChange={() => setJobType('seo')}
                disabled={loading}
              />
              <span style={styles.radioText}>SEO Analysis</span>
            </label>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
            disabled={loading || !url.trim()}
          >
            {loading ? 'Processing...' : 'Analyze'}
          </button>
        </div>
      </form>

      <div style={styles.jobsSection}>
        <h2 style={styles.jobsTitle}>Recent Jobs ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p style={styles.emptyState}>No jobs yet. Submit a URL to get started.</p>
        ) : (
          <div style={styles.jobsList}>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                expanded={expandedJobId === job.id}
                onToggle={() => toggleExpand(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({
  job,
  expanded,
  onToggle
}: {
  job: CrawlJob
  expanded: boolean
  onToggle: () => void
}) {
  const statusColors = {
    pending: '#f59e0b',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444'
  }

  return (
    <div style={styles.jobCard}>
      <div style={styles.jobHeader} onClick={onToggle}>
        <div style={styles.jobInfo}>
          <div style={styles.jobUrl}>{job.url}</div>
          <div style={styles.jobMeta}>
            <span style={{ ...styles.jobStatus, backgroundColor: statusColors[job.status] }}>
              {job.status}
            </span>
            <span style={styles.jobType}>{job.type.toUpperCase()}</span>
            <span style={styles.jobTime}>
              {new Date(job.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div style={styles.expandIcon}>{expanded ? '▼' : '▶'}</div>
      </div>

      {expanded && (
        <div style={styles.jobContent}>
          {job.status === 'failed' && (
            <div style={styles.errorBox}>{job.error}</div>
          )}
          {job.status === 'completed' && job.result && (
            job.type === 'seo' ? (
              <SeoReportView report={job.result as any} />
            ) : (
              <ScrapedContentView content={job.result as any} />
            )
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280'
  },
  form: {
    backgroundColor: '#f9fafb',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '32px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  radioGroup: {
    display: 'flex',
    gap: '24px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  radioText: {
    fontSize: '14px'
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },
  jobsSection: {
    marginTop: '32px'
  },
  jobsTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '48px'
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  jobCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  jobInfo: {
    flex: 1
  },
  jobUrl: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
    wordBreak: 'break-all'
  },
  jobMeta: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  jobStatus: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  jobType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase'
  },
  jobTime: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  expandIcon: {
    fontSize: '12px',
    color: '#6b7280'
  },
  jobContent: {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '14px'
  }
}
