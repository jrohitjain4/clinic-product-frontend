import Chart from "react-apexcharts";

interface SCol19ChartProps {
  data: { month: string, completed: number, ongoing: number, rescheduled: number }[];
}

const SCol19Chart = ({ data = [] }: SCol19ChartProps) => {
  const chartOptions: any = {
    chart: {
      type: "bar",
      height: 250,
      stacked: true,
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "25%",
        borderRadius: 2,
        distributed: false,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 0,
      colors: ["#fff"],
    },
    colors: ["#00D1D1", "#1E90FF", "#3B28CC"],
    xaxis: {
      categories: data.map(d => d.month),
      labels: {
        style: {
          fontSize: "12px",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
        },
        formatter: (val: number) => val.toFixed(0),
        offsetX: -10,
      },
    },
    legend: {
      position: "bottom",
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: {
        left: 0,
        right: -10,
      },
    },
    tooltip: { enabled: true },
  };

  const series = [
    {
      name: "Completed",
      data: data.map(d => d.completed),
    },
    {
      name: "Ongoing",
      data: data.map(d => d.ongoing),
    },
    {
      name: "Rescheduled",
      data: data.map(d => d.rescheduled),
    },
  ];

  return (
    <div id="s-col-19">
      <Chart options={chartOptions} series={series} type="bar" height={250} />
    </div>
  );
};

export default SCol19Chart;
