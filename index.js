import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";
import Handlebars from "handlebars";
import htmlToPdfmake from "html-to-pdfmake";
import { JSDOM } from "jsdom";
import PdfPrinter from "pdfmake";

const fonts = {
  Roboto: {
    normal: "fonts/Roboto-Regular.ttf",
    bold: "fonts/Roboto-Medium.ttf",
    italics: "fonts/Roboto-Italic.ttf",
    bolditalics: "fonts/Roboto-MediumItalic.ttf",
  },
};

const source = fs.readFileSync("template.html", "utf8");
const template = Handlebars.compile(source, { noEscape: true });

const pdfPrinter = new PdfPrinter(fonts);

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

const data = {
  name: "Alan",
  hometown: "Somewhere, TX",
  kids: [
    { name: "Jimmy", age: "12" },
    { name: "Sally", age: "4" },
  ],
  chartImage: await generateChartImageBase64(chartConfig),
};

const result = template(data);
const dom = new JSDOM("");
const pdfContent = htmlToPdfmake(result, { window: dom.window });

const docDefinition = {
  content: pdfContent,
};

const pdfDoc = pdfPrinter.createPdfKitDocument(docDefinition);

pdfDoc.pipe(fs.createWriteStream("output.pdf"));
pdfDoc.end();

console.log("PDF created successfully");
