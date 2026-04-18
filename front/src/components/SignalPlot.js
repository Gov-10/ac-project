"use client";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
});

export default function SignalPlot({ time, data, title }) {
  return (
    <Plot
      data={[
        {
          x: time,
          y: data,
          type: "scatter",
          mode: "lines",
        },
      ]}
      layout={{
        title,
        xaxis: { title: "Time" },
        yaxis: { title: "Amplitude" },
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}

