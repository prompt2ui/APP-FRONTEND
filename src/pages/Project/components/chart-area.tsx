"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Priority stacked area chart with gradient fill"

const chartConfig = {
  high: {
    label: "High",
    color: "#A84446",
  },
  medium: {
    label: "Medium",
    color: "#9FA83F",
  },
  low: {
    label: "Low",
    color: "#498D52",
  },
} satisfies ChartConfig

type ChartAreaStackedProps = {
  tests: {
    start_time?: string
    testcases: {
      testcase_piority?: string
    }[]
  }[]
}

export function ChartAreaStacked({ tests }: ChartAreaStackedProps) {
  const buckets = ["Today", "7 วัน", "30 วัน"] as const

  const chartData = buckets.map((bucket) => {
    const now = new Date().getTime()

    const inBucket = tests.filter((test) => {
      if (!test.start_time) return false
      const t = new Date(test.start_time).getTime()
      const diffDays = (now - t) / (1000 * 60 * 60 * 24)
      if (bucket === "Today") return diffDays <= 1
      if (bucket === "7 วัน") return diffDays <= 7
      return diffDays <= 30
    })

    const counts = { high: 0, medium: 0, low: 0 }
    inBucket.forEach((test) => {
      test.testcases.forEach((tc) => {
        const p = tc.testcase_piority?.toLowerCase()
        if (p === "high") counts.high += 1
        else if (p === "medium") counts.medium += 1
        else counts.low += 1
      })
    })

    return { bucket, ...counts }
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>แนวโน้มความสำคัญของ Test Case</CardTitle>
        <CardDescription>สรุปตามช่วงเวลา Today / 7 วัน / 30 วัน</CardDescription>
      </CardHeader>

      <CardContent className="h-60">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart
            height={120}
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            <defs>
              <linearGradient id="fillHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-high)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-high)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-medium)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-medium)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-low)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-low)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <Area
              dataKey="low"
              type="natural"
              fill="url(#fillLow)"
              stroke="var(--color-low)"
              stackId="a"
            />
            <Area
              dataKey="medium"
              type="natural"
              fill="url(#fillMedium)"
              stroke="var(--color-medium)"
              stackId="a"
            />
            <Area
              dataKey="high"
              type="natural"
              fill="url(#fillHigh)"
              stroke="var(--color-high)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      {/* <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Priority distribution over the last 6 months
            </div>
          </div>
        </div>
      </CardFooter> */}
    </Card>
  )
}
