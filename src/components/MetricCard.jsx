import { Card, Metric, Text } from '@tremor/react'

export function MetricCard({ title, value }) {
  return (
    <Card className="panel-card rounded-md p-5">
      <Text className="!text-xs !uppercase !tracking-wide !text-blue-900/45">{title}</Text>
      <Metric className="!mt-3 !text-[48px] !font-semibold !tracking-tight !text-blue-950">{value}</Metric>
    </Card>
  )
}
