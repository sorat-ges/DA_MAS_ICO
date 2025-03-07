import fs from "fs";
import path from "path";
import readline from "readline";

/**
 * Reads a CSV file and returns an array of objects.
 * @param {string} filePath - Path to the CSV file.
 * @param {string} delimiter - Delimiter used in the CSV file.
 * @returns {Promise<object[]>} Parsed data as an array of objects.
 */
async function readCSV(filePath, delimiter = "|") {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return [];
  }

  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const rows = [];
  let headers = [];

  for await (const line of rl) {
    const fields = line.split(delimiter).map(field => field.trim().replace(/^"|"$/g, ''));
    if (headers.length === 0) {
      headers = fields; // Set headers from first row
    } else {
      rows.push(Object.fromEntries(headers.map((header, i) => [header, fields[i] || ""])));
    }
  }
  return rows;
}

/**
 * Reads the template file and returns an array of field names.
 * @param {string} templateFilePath - Path to the template file.
 * @returns {Promise<string[]>} Array of field names.
 */
async function readTemplateFields(templateFilePath) {
  if (!fs.existsSync(templateFilePath)) {
    console.error(`❌ Template file not found: ${templateFilePath}`);
    return [];
  }

  const stream = fs.createReadStream(templateFilePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    rl.close();
    return line.split("|").map(field => field.trim()); // Use '|' as delimiter for template
  }
  return [];
}

/**
 * Generates a valid output file path based on a template filename.
 * @param {string} templateFileName - The template filename with placeholders.
 * @param {number} dbdNo - Database number.
 * @param {number} assetId - Asset ID.
 * @param {number} yyyymmdd - Date in YYYYMMDD format.
 * @returns {string} Output file path.
 */
function getOutputFilePath(templateFileName, dbdNo, assetId, yyyymmdd) {
  const outputDir = "output";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Replace placeholders in the template filename
  const outputFileName = templateFileName
    .replace("{dbdNo}", dbdNo)
    .replace("{assetId}", assetId)
    .replace("{yyyymmdd}", yyyymmdd);

  return path.join(outputDir, outputFileName);
}

/**
 * Reads customer data from a predefined CSV file.
 * @returns {Promise<object[]>} Parsed customer data.
 */
async function getCustomerData() {
  const customerFile = "DA-Master/ico_customer_export_pipe.csv";
  return await readCSV(customerFile, "|"); // Read as pipe-delimited
}

/**
 * Generates a data file based on a given template.
 * @param {string} templateFileName - The template filename with placeholders.
 * @param {number} dbdNo - Database number.
 * @param {number} assetId - Asset ID.
 * @param {number} yyyymmdd - Date in YYYYMMDD format.
 */
export async function generateData(templateFileName, dbdNo, assetId, yyyymmdd) {
  const customers = await getCustomerData();
  const templateFilePath = path.join("DA-template", templateFileName);
  const fields = await readTemplateFields(templateFilePath);

  if (fields.length === 0) {
    console.error(`❌ No fields found in template: ${templateFilePath}`);
    return;
  }

  // Process data based on template fields
  if (templateFileName === 'ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processCusData(customers,fields);
  }
  else if (templateFileName === 'ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processOutStanding(customers,fields);
  }
  else if (templateFileName === 'ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processCusWallet(customers,fields);
  }
  else if (templateFileName === 'ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processIdentification(customers,fields);
  }
  else if (templateFileName === 'ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processProfilePortal(customers,fields);
  }

  const outputFilePath = getOutputFilePath(templateFileName, dbdNo, assetId, yyyymmdd);
  fs.writeFileSync(outputFilePath, [fields.join("|"), ...processedData].join("\n"), "utf-8");

  console.log(`✅ File generated: ${outputFilePath}`);
}

function processCusData(customers,fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processOutStanding(customers,fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processCusWallet(customers,fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processIdentification(customers,fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processProfilePortal(customers,fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

// 🚀 Generate multiple templates dynamically
const dbdNo = 111;
const assetId = 4846;
const yyyymmdd = 20250307;

const templates = [
  "ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv"
];

templates.forEach(template => generateData(template, dbdNo, assetId, yyyymmdd));