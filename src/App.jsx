import { useEffect, useMemo, useRef, useState } from 'react'

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const STATUS_RULES = {
  PNS: 20,
  P3K: 0,
}

function App() {
  const [records, setRecords] = useState([])
  const [now, setNow] = useState(new Date())
  const scrollViewportRef = useRef(null)
  const scrollContentRef = useRef(null)
  const animationFrameRef = useRef(0)
  const scrollStateRef = useRef({
    direction: 1,
    paused: false,
    lastTs: 0,
  })

  useEffect(() => {
    fetch('/data/jp-data.json')
      .then((response) => response.json())
      .then((payload) => setRecords(payload.records ?? []))
      .catch((error) => {
        console.error('Failed to load JSON data', error)
      })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    const content = scrollContentRef.current

    if (!viewport || !content || records.length === 0) {
      return undefined
    }

    const maxScroll = Math.max(0, content.scrollHeight - viewport.clientHeight)
    if (maxScroll === 0) {
      return undefined
    }

    const speedPerSecond = 32

    const tick = (ts) => {
      const state = scrollStateRef.current

      if (!state.lastTs) {
        state.lastTs = ts
      }

      const delta = ts - state.lastTs
      state.lastTs = ts

      if (!state.paused) {
        const nextTop =
          viewport.scrollTop + state.direction * (speedPerSecond * delta) / 1000

        if (nextTop >= maxScroll) {
          viewport.scrollTop = maxScroll
          state.direction = -1
        } else if (nextTop <= 0) {
          viewport.scrollTop = 0
          state.direction = 1
        } else {
          viewport.scrollTop = nextTop
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    const handlePointerEnter = () => {
      scrollStateRef.current.paused = true
    }

    const handlePointerLeave = () => {
      scrollStateRef.current.paused = false
    }

    viewport.addEventListener('mouseenter', handlePointerEnter)
    viewport.addEventListener('mouseleave', handlePointerLeave)
    animationFrameRef.current = window.requestAnimationFrame(tick)

    return () => {
      viewport.removeEventListener('mouseenter', handlePointerEnter)
      viewport.removeEventListener('mouseleave', handlePointerLeave)
      window.cancelAnimationFrame(animationFrameRef.current)
      scrollStateRef.current.lastTs = 0
    }
  }, [records])

  const dashboard = useMemo(() => {
    const normalizedRecords = records.map((record, index) => {
      const threshold = STATUS_RULES[record.employeeType] ?? 0
      const totalHours = Number(record.totalHours) || 0
      const progress =
        record.employeeType === 'PNS'
          ? Math.min(100, Math.round((totalHours / threshold) * 100))
          : totalHours > 0
            ? 100
            : 0
      const completed =
        record.employeeType === 'PNS' ? totalHours >= threshold : totalHours > threshold

      return {
        ...record,
        index: index + 1,
        threshold,
        totalHours,
        progress,
        completed,
      }
    })

    const summaryByType = ['PNS', 'P3K'].map((type) => {
      const items = normalizedRecords.filter((record) => record.employeeType === type)
      const completed = items.filter((record) => record.completed).length
      const averageHours =
        items.length > 0
          ? Math.round(
              (items.reduce((sum, item) => sum + item.totalHours, 0) / items.length) * 10,
            ) / 10
          : 0

      return {
        type,
        total: items.length,
        completed,
        pending: items.length - completed,
        completionRate: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
        averageHours,
      }
    })

    const overallCompleted = normalizedRecords.filter((record) => record.completed).length

    return {
      records: normalizedRecords,
      summaryByType,
      totals: {
        total: normalizedRecords.length,
        completed: overallCompleted,
        pending: normalizedRecords.length - overallCompleted,
        completionRate:
          normalizedRecords.length > 0
            ? Math.round((overallCompleted / normalizedRecords.length) * 100)
            : 0,
      },
    }
  }, [records])

  return (
    <main className="page-shell">
      <section className="dashboard">
        <header className="hero-bar">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="hero-copy">
            <p className="hero-kicker">Panel Informasi JP</p>
            <h1>PROSES PEMENUHAN PENGEMBANGAN KOMPETENSI</h1>
            <p>BP2JK Wilayah Jawa Timur</p>
          </div>

          <div className="clock-card">
            <span>{DATE_FORMATTER.format(now)}</span>
            <strong>{TIME_FORMATTER.format(now)}</strong>
          </div>
        </header>

        <section className="summary-grid">
          <SummaryCard
            title="Total Pegawai"
            value={dashboard.totals.total}
            subtitle={`${dashboard.totals.completed} sudah memenuhi`}
            tone="solid"
          />
          <SummaryCard
            title="Tingkat Penyelesaian"
            value={`${dashboard.totals.completionRate}%`}
            subtitle={`${dashboard.totals.pending} masih belum memenuhi`}
            tone="soft"
          />
          {dashboard.summaryByType.map((item) => (
            <SummaryCard
              key={item.type}
              title={`${item.type} Selesai`}
              value={`${item.completed}/${item.total}`}
              subtitle={`Rata-rata ${item.averageHours} JP`}
              tone={item.type === 'PNS' ? 'solid' : 'soft'}
            />
          ))}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Progress Pemenuhan JP</p>
              <h2>Daftar Pegawai BP2JK Jawa Timur</h2>
            </div>
            <div className="legend">
              <span>
                <i className="legend-dot success" />
                Memenuhi
              </span>
              <span>
                <i className="legend-dot pending" />
                Belum memenuhi
              </span>
            </div>
          </div>

          <div className="table-frame" ref={scrollViewportRef}>
            <div ref={scrollContentRef}>
              <table className="info-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Tipe</th>
                    <th>Total JP</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.records.map((record) => (
                    <tr key={`${record.employeeType}-${record.name}-${record.index}`}>
                      <td>{record.index}</td>
                      <td>
                        <div className="name-cell">
                          <strong>{record.name}</strong>
                          <span>{record.employeeType === 'PNS' ? 'Target 20 JP' : 'Minimal 1 kegiatan'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${record.employeeType.toLowerCase()}`}>
                          {record.employeeType}
                        </span>
                      </td>
                      <td>{record.totalHours}</td>
                      <td>{record.employeeType === 'PNS' ? '>= 20 JP' : '> 0 JP'}</td>
                      <td>
                        <span className={`status-pill ${record.completed ? 'ok' : 'wait'}`}>
                          {record.completed ? 'Memenuhi' : 'Belum'}
                        </span>
                      </td>
                      <td>
                        <div className="progress-cell">
                          <span>{record.progress}%</span>
                          <div className="progress-track">
                            <div
                              className={`progress-bar ${record.completed ? 'ok' : 'wait'}`}
                              style={{ width: `${record.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

function SummaryCard({ title, value, subtitle, tone }) {
  return (
    <article className={`summary-card ${tone}`}>
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{subtitle}</span>
    </article>
  )
}

export default App
