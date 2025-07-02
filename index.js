import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import ejs from "ejs";
import fs from "fs";
import htmlToPdfmake from "html-to-pdfmake";
import { JSDOM } from "jsdom";
import juice from "juice";
import PdfPrinter from "pdfmake";

const fonts = {
  Inter: {
    normal: "fonts/Inter_28pt-Regular.ttf",
    bold: "fonts/Inter_28pt-Medium.ttf",
    italics: "fonts/Inter_28pt-Italic.ttf",
    bolditalics: "fonts/Inter_28pt-MediumItalic.ttf",
  },
};

const source = fs.readFileSync("pdf.html", "utf8");

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

const template = ejs.compile(source, { async: true });
const result = await template(data);
// const inlinedHtml = juice(result); // CSS <style> converted to inline

const dom = new JSDOM("");
const pdfContent = htmlToPdfmake(result, { window: dom.window });

// 1. Extract widths from HTML
function extractTableWidths(html) {
  const dom = new JSDOM(html);
  const tables = [...dom.window.document.querySelectorAll("table")];
  const widthMap = [];

  tables.forEach((table) => {
    const firstRow = table.querySelector("tr");
    const cells = firstRow ? [...firstRow.children] : [];
    const widths = cells.map((cell) => {
      const w = cell.style.width || cell.getAttribute("width");
      if (w?.includes("px")) return parseInt(w);
      if (w?.includes("%")) return w; // optional: support percent
      return "*"; // fallback
    });
    widthMap.push(widths);
  });

  return widthMap;
}

// 2. Recursively inject widths into pdfmake tables
function applyWidthsToTables(content, widthsList, idx = { i: 0 }) {
  if (Array.isArray(content)) {
    content.forEach((item) => applyWidthsToTables(item, widthsList, idx));
  } else if (content?.table && !content.table.widths) {
    content.table.widths = widthsList[idx.i] || ["*"];
    idx.i++;
    // Process nested content within table cells
    if (content.table.body) {
      content.table.body.forEach((row) => {
        if (Array.isArray(row)) {
          row.forEach((cell) => applyWidthsToTables(cell, widthsList, idx));
        }
      });
    }
  } else if (typeof content === "object") {
    ["content", "stack", "columns"].forEach((key) => {
      if (content[key]) applyWidthsToTables(content[key], widthsList, idx);
    });
  }
}
const widthMaps = extractTableWidths(result);
console.log("Extracted widths:", widthMaps);
applyWidthsToTables(pdfContent, extractTableWidths(result));

const docDefinition = {
  content: pdfContent,
  defaultStyle: {
    font: "Inter",
  },
  layout: {
    hLineColor: function (i, node) {
      // Make only the bottom-most line red
      return i === node.table.body.length ? "red" : "black";
    },
  },
  footer: function (currentPage, pageCount) {
    return {
      text: `Page ${currentPage} / ${pageCount}`,
      alignment: "left",
      fontSize: 9,
      margin: [50, 0, 0, 40], // left, top, right, bottom
    };
  },
};

const pdfDoc = pdfPrinter.createPdfKitDocument(docDefinition);

pdfDoc.pipe(fs.createWriteStream("output.pdf"));
pdfDoc.end();

console.log("PDF created successfully");
