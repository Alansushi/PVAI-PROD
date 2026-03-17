import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DBProject, DBDeliverable, DBProjectMember, DBProjectRisk, DBProjectKPI } from '@/lib/db-types'

// Hardcoded brand colors (no Tailwind in PDF)
const C = {
  navy:    '#0C1F35',
  accent:  '#2E8FC0',
  green:   '#2A9B6F',
  amber:   '#E09B3D',
  red:     '#D94F4F',
  gray:    '#8B9CB5',
  white:   '#FFFFFF',
  surface: '#132842',
  border:  '#1E3A5F',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.navy,
    padding: 40,
    fontFamily: 'Helvetica',
    color: C.white,
  },
  // Header
  header: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white },
  headerType: { fontSize: 9, color: C.gray, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  headerDate: { fontSize: 8, color: C.gray },
  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  statusText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Section
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  // Grid row
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  // Stat box
  statBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  statLabel: { fontSize: 7, color: C.gray, textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.accent },
  statSub: { fontSize: 8, color: C.gray, marginTop: 2 },
  // Progress bar
  barContainer: { height: 6, backgroundColor: C.border, borderRadius: 3, marginTop: 4 },
  barFill: { height: 6, borderRadius: 3 },
  // KPI row
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 8,
  },
  kpiName: { fontSize: 9, color: C.white, flex: 1 },
  kpiPct: { fontSize: 9, fontFamily: 'Helvetica-Bold', width: 32, textAlign: 'right' },
  kpiBarBg: { width: 80, height: 5, backgroundColor: C.border, borderRadius: 3 },
  kpiBarFill: { height: 5, borderRadius: 3 },
  // Risk row
  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 5,
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 8,
  },
  riskScore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  riskScoreText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white },
  riskTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white, flex: 1 },
  riskDesc: { fontSize: 8, color: C.gray, marginTop: 2 },
  riskStatus: { fontSize: 7, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  // Deliverable row
  delRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  delName: { fontSize: 9, color: C.white, flex: 1 },
  delDate: { fontSize: 8, color: C.gray },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.gray },
})

const SCORE: Record<string, number> = { low: 1, medium: 2, high: 3 }
const STATUS_COLOR: Record<string, string> = { ok: C.green, warn: C.amber, danger: C.red }

function statusLabel(s: string) {
  return s === 'ok' ? 'Al corriente' : s === 'warn' ? 'En riesgo' : 'Crítico'
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  project: DBProject
  deliverables: DBDeliverable[]
  members: DBProjectMember[]
  risks: DBProjectRisk[]
  kpis: DBProjectKPI[]
}

export default function ProjectReportPDF({ project, deliverables, members, risks, kpis }: Props) {
  const done = deliverables.filter(d => d.status === 'ok').length
  const total = deliverables.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const overdueCount = deliverables.filter(
    d => d.status !== 'ok' && d.dueDate && new Date(d.dueDate) < new Date(),
  ).length

  const sortedRisks = [...risks]
    .filter(r => r.status === 'open')
    .sort((a, b) => (SCORE[b.probability] * SCORE[b.impact]) - (SCORE[a.probability] * SCORE[a.impact]))
    .slice(0, 5)

  const overdue = deliverables
    .filter(d => d.status !== 'ok' && d.dueDate && new Date(d.dueDate) < new Date())
    .slice(0, 8)

  const generatedAt = new Date().toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const statusColor = STATUS_COLOR[project.status] ?? C.gray

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{project.title}</Text>
            <Text style={styles.headerType}>{project.type}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                ● {statusLabel(project.status)}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 8, color: C.gray }}>Reporte ejecutivo</Text>
            <Text style={[styles.headerDate, { marginTop: 3 }]}>{generatedAt}</Text>
            {project.endDate && (
              <Text style={[styles.headerDate, { marginTop: 2 }]}>
                Deadline: {fmtDate(project.endDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Estado General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado General</Text>
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avance</Text>
              <Text style={[styles.statValue, { color: pct >= 80 ? C.green : pct >= 40 ? C.accent : C.amber }]}>
                {pct}%
              </Text>
              <Text style={styles.statSub}>{done}/{total} completadas</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? C.green : pct >= 40 ? C.accent : C.amber }]} />
              </View>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Miembros</Text>
              <Text style={[styles.statValue, { color: C.white }]}>{members.length}</Text>
              <Text style={styles.statSub}>en el equipo</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Vencidas</Text>
              <Text style={[styles.statValue, { color: overdueCount > 0 ? C.red : C.green }]}>
                {overdueCount}
              </Text>
              <Text style={styles.statSub}>sin completar</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Riesgos</Text>
              <Text style={[styles.statValue, { color: sortedRisks.length > 0 ? C.amber : C.green }]}>
                {sortedRisks.length}
              </Text>
              <Text style={styles.statSub}>abiertos</Text>
            </View>
          </View>
        </View>

        {/* KPIs */}
        {kpis.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KPIs del Proyecto</Text>
            {kpis.map(kpi => {
              const pctKPI = kpi.target > 0 ? Math.min(Math.round((kpi.current / kpi.target) * 100), 100) : 0
              const kpiColor = pctKPI >= 80 ? C.green : pctKPI >= 40 ? C.accent : C.amber
              return (
                <View key={kpi.id} style={styles.kpiRow}>
                  <Text style={styles.kpiName}>{kpi.title}</Text>
                  <View style={styles.kpiBarBg}>
                    <View style={[styles.kpiBarFill, { width: `${pctKPI}%`, backgroundColor: kpiColor }]} />
                  </View>
                  <Text style={[styles.kpiPct, { color: kpiColor }]}>{pctKPI}%</Text>
                  <Text style={{ fontSize: 8, color: C.gray, width: 60, textAlign: 'right' }}>
                    {kpi.current}/{kpi.target} {kpi.unit}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Risks */}
        {sortedRisks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Riesgos Abiertos</Text>
            {sortedRisks.map(risk => {
              const score = SCORE[risk.probability] * SCORE[risk.impact]
              const riskColor = score >= 6 ? C.red : score >= 3 ? C.amber : C.green
              return (
                <View key={risk.id} style={styles.riskRow}>
                  <View style={[styles.riskScore, { backgroundColor: riskColor + '30' }]}>
                    <Text style={[styles.riskScoreText, { color: riskColor }]}>{score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.riskTitle}>{risk.title}</Text>
                    {risk.description && <Text style={styles.riskDesc}>{risk.description}</Text>}
                    {risk.mitigation && (
                      <Text style={[styles.riskDesc, { color: C.accent, marginTop: 2 }]}>
                        Mitigación: {risk.mitigation}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Text style={{ fontSize: 7, color: C.gray }}>
                      Prob: {risk.probability} · Imp: {risk.impact}
                    </Text>
                    {risk.ownerName && (
                      <Text style={{ fontSize: 7, color: C.gray }}>{risk.ownerName}</Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Overdue deliverables */}
        {overdue.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entregables Vencidos ({overdue.length})</Text>
            {overdue.map(d => (
              <View key={d.id} style={styles.delRow}>
                <View style={[styles.dot, { backgroundColor: STATUS_COLOR[d.status] ?? C.gray }]} />
                <Text style={styles.delName}>{d.name}</Text>
                {d.ownerName && <Text style={styles.delDate}>{d.ownerName}</Text>}
                <Text style={[styles.delDate, { color: C.red }]}>{fmtDate(d.dueDate)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generado por pvai-next · {generatedAt}</Text>
          <Text style={styles.footerText}>{project.title}</Text>
        </View>

      </Page>
    </Document>
  )
}
