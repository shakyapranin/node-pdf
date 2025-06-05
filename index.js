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

const data = {
  name: "Alan",
  hometown: "Somewhere, TX",
  kids: [
    { name: "Jimmy", age: "12" },
    { name: "Sally", age: "4" },
  ],
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
