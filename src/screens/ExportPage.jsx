import { Card, Grid, Text, Title } from '@tremor/react'

export function ExportPage() {
  return (
    <Grid numItemsLg={3} className="gap-3">
      <Card className="panel-card rounded-md p-5">
        <span className="soft-badge soft-badge-neutral">Phase 6</span>
        <Title className="mt-3 !text-xl !text-blue-950">Export Seluruh Pegawai</Title>
        <Text className="mt-2 !text-blue-900/55">Modul ini disiapkan untuk rekap Excel global dengan filter tahun dan status.</Text>
      </Card>
      <Card className="panel-card rounded-md p-5">
        <span className="soft-badge soft-badge-neutral">Per Nama</span>
        <Title className="mt-3 !text-xl !text-blue-950">Export Per Pegawai</Title>
        <Text className="mt-2 !text-blue-900/55">Nanti akan berisi selector pegawai, preview summary, dan unduh rekap personal.</Text>
      </Card>
      <Card className="panel-card rounded-md p-5">
        <span className="soft-badge soft-badge-neutral">Roadmap</span>
        <Title className="mt-3 !text-xl !text-blue-950">Queue dan Filter</Title>
        <Text className="mt-2 !text-blue-900/55">Setelah export, bagian ini cocok untuk opsi bulk export, status job, dan audit log.</Text>
      </Card>
    </Grid>
  )
}
