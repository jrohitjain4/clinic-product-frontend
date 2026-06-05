import Chart from "react-apexcharts";

interface CircleChartProps {
  data: { name: string, patientCount: number }[];
}

const CircleChart = ({ data }: CircleChartProps) => {
  const chartOptions: any = {
    chart: {
      type: "donut",
      height: 270,
      width: "100%",
    },
    labels: data.map(d => `${d.patientCount} ${d.name}`),
    colors: ["#6DA6F2", "#5C60CC", "#9B51B6"],
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      colors: ["#fff"],
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontWeight: 400,
              offsetY: -10,
              color: "#0A1B39",
            },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 700,
              offsetY: 10,
              color: "#0A1B39",
            },
            total: {
              show: true,
              label: "Total Patient",
              fontSize: "14px",
              color: "#0A1B39",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      enabled: true,
    },
  };

  const series = data.map(d => d.patientCount);

  return (
    <div id="circle-chart">
      <Chart options={chartOptions} series={series} type="donut" height={270} />
    </div>
  );
};

export default CircleChart;
