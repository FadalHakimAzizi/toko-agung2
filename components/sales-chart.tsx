"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  TooltipItem,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<"line">) => {
          let label = context.dataset.label || ""
          if (label) label += ": "
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(context.parsed.y)
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number | string) =>
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(Number(value)),
      },
    },
  },
}

interface LineChartProps {
    chartData: ChartData<'line'>;
}

export function LineChart({ chartData }: LineChartProps) {
  // Jika tidak ada data, tampilkan pesan atau fallback UI
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Memuat data grafik...</div>;
  }
  
  return <Line options={options} data={chartData} />
}