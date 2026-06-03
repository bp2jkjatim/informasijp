"use client";

import { Card, ProgressBar, Text } from "@tremor/react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  progress?: number;
};

export function MetricCard({ label, value, detail, progress }: MetricCardProps) {
  return (
    <Card className="planner-card rounded-3xl p-5">
      <Text className="!text-xs !font-medium !text-slate-500">
        {label}
      </Text>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
      {typeof progress === "number" ? (
        <div className="mt-4">
          <ProgressBar value={progress} color="blue" />
        </div>
      ) : null}
    </Card>
  );
}
