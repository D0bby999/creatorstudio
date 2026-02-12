import type { CSSProperties } from 'react'
import type { ScrapedContent } from '../types/crawler-types'

export function ScrapedContentView({ content }: { content: ScrapedContent }) {
  return (
    <div style={styles.container}>
      {/* Basic Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Page Information</h3>
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Title:</span>
            <span style={styles.infoValue}>{content.title || 'No title'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Description:</span>
            <span style={styles.infoValue}>{content.description || 'No description'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>URL:</span>
            <a href={content.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {content.url}
            </a>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Content Statistics</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{content.headings.length}</div>
            <div style={styles.statLabel}>Headings</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{content.images.length}</div>
            <div style={styles.statLabel}>Images</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{content.links.length}</div>
            <div style={styles.statLabel}>Links</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{Math.round(content.text.length / 1000)}k</div>
            <div style={styles.statLabel}>Characters</div>
          </div>
        </div>
      </div>

      {/* Headings */}
      {content.headings.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Headings ({content.headings.length})</h3>
          <ul style={styles.list}>
            {content.headings.slice(0, 10).map((heading, i) => (
              <li key={i} style={styles.listItem}>{heading}</li>
            ))}
            {content.headings.length > 10 && (
              <li style={styles.listItemMuted}>
                ... and {content.headings.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Meta Tags */}
      {Object.keys(content.meta).length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Meta Tags ({Object.keys(content.meta).length})</h3>
          <div style={styles.metaGrid}>
            {Object.entries(content.meta).slice(0, 8).map(([key, value]) => (
              <div key={key} style={styles.metaItem}>
                <div style={styles.metaKey}>{key}</div>
                <div style={styles.metaValue}>{value}</div>
              </div>
            ))}
            {Object.keys(content.meta).length > 8 && (
              <div style={styles.metaItemMuted}>
                ... and {Object.keys(content.meta).length - 8} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Preview */}
      {content.text && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Text Content Preview</h3>
          <div style={styles.textBox}>
            {content.text.slice(0, 500)}
            {content.text.length > 500 && '...'}
          </div>
        </div>
      )}

      {/* Images Preview */}
      {content.images.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Images ({content.images.length})</h3>
          <ul style={styles.list}>
            {content.images.slice(0, 5).map((img, i) => (
              <li key={i} style={styles.listItem}>
                <a href={img} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {img.length > 80 ? `${img.slice(0, 80)}...` : img}
                </a>
              </li>
            ))}
            {content.images.length > 5 && (
              <li style={styles.listItemMuted}>
                ... and {content.images.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Links Preview */}
      {content.links.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Links ({content.links.length})</h3>
          <ul style={styles.list}>
            {content.links.slice(0, 5).map((link, i) => (
              <li key={i} style={styles.listItem}>
                <a href={link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {link.length > 80 ? `${link.slice(0, 80)}...` : link}
                </a>
              </li>
            ))}
            {content.links.length > 5 && (
              <li style={styles.listItemMuted}>
                ... and {content.links.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div style={styles.footer}>
        Scraped at {new Date(content.scrapedAt).toLocaleString()}
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
  section: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#111827'
  },
  infoBox: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '100px'
  },
  infoValue: {
    fontSize: '14px',
    color: '#6b7280',
    flex: 1,
    wordBreak: 'break-word'
  },
  link: {
    fontSize: '14px',
    color: '#3b82f6',
    textDecoration: 'none',
    wordBreak: 'break-all'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px'
  },
  statBox: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  list: {
    margin: '0',
    paddingLeft: '20px',
    listStyle: 'disc'
  },
  listItem: {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#374151'
  },
  listItemMuted: {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px'
  },
  metaItem: {
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px'
  },
  metaKey: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px'
  },
  metaValue: {
    fontSize: '13px',
    color: '#111827',
    wordBreak: 'break-word'
  },
  metaItemMuted: {
    padding: '12px',
    fontSize: '14px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center'
  },
  textBox: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  footer: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '8px'
  }
}
