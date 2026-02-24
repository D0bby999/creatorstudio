interface SwatchSectionProps {
  label: string
  colors: string[]
  value: string
  onSelect: (color: string) => void
}

export function SwatchSection({ label, colors, value, onSelect }: SwatchSectionProps) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {colors.map((c) => (
          <SwatchBtn key={c} color={c} active={value === c} onClick={() => onSelect(c)} />
        ))}
      </div>
    </div>
  )
}

function SwatchBtn({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        border: active ? '2px solid #333' : '1px solid #ddd',
        background: color,
        cursor: 'pointer',
        padding: 0,
      }}
    />
  )
}
