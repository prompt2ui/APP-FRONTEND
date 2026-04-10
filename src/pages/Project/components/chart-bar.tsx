"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Stacked bar chart by priority levels"

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

type ChartBarStackedProps = {
  tests: {
    test_name: string
    testcases: {
      testcase_piority?: string
    }[]
  }[]
}

export function ChartBarStacked({ tests }: ChartBarStackedProps) {
  const chartData = tests.map((test) => {
    const counts = { high: 0, medium: 0, low: 0 }
    test.testcases.forEach((tc) => {
      const p = tc.testcase_piority?.toLowerCase()
      if (p === "high") counts.high += 1
      else if (p === "medium") counts.medium += 1
      else counts.low += 1
    })

    return {
      test: test.test_name,
      ...counts,
    }
  })

  return (
    <Card className="h-full pb-20">
      <CardHeader>
        <CardTitle>การกระจายระดับความสำคัญต่อ Test</CardTitle>
        <CardDescription>จำนวน Test Case แยกตาม High / Medium / Low</CardDescription>
      </CardHeader>

      <CardContent className="h-56">
        <ChartContainer config={chartConfig} className="w-full h-72">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="test"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />

            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Bar dataKey="low" stackId="a" fill="var(--color-low)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" />
            <Bar dataKey="high" stackId="a" fill="var(--color-high)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>

      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing priority distribution per test run
        </div>
      </CardFooter> */}
    </Card>
  )
}
