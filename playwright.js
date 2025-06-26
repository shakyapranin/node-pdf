import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import ejs from "ejs";
import fs from "fs";
import juice from "juice";
import { chromium } from "playwright";

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 400 });

async function generateChartImageBase64(config) {
  const image = await chartJSNodeCanvas.renderToDataURL(config);
  return image; // This is a data:image/png;base64,... string
}

const chartConfig = {
  type: "bar",
  data: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Revenue ($)",
        data: [15000, 20000, 18000, 22000],
        backgroundColor: ["#60a5fa", "#34d399", "#fbbf24", "#f87171"],
      },
    ],
  },
  options: {
    responsive: false, // Required for headless render
    animation: false, // Important to avoid delays in canvas rendering
    plugins: {
      title: {
        display: true,
        text: "Quarterly Revenue",
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
};

const source = fs.readFileSync("pdf-flex.html", "utf8");

const data = {
  name: "Alan",
  hometown: "Somewhere, TX",
  kids: [
    { name: "Jimmy", age: "12" },
    { name: "Sally", age: "4" },
  ],
  chartImage: await generateChartImageBase64(chartConfig),
};

const template = ejs.compile(source, { async: true });
const result = await template(data);
const inlinedHtml = juice(result); // CSS <style> converted to inline

console.log(inlinedHtml);

// Launch Playwright browser and generate PDF
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(inlinedHtml);
await page.pdf({ path: "playwright_output.pdf", format: "A4" });
await browser.close();

console.log("PDF created successfully");
