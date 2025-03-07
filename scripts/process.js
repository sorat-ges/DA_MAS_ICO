import fs from "fs";
import path from "path";
import readline from "readline";
import xlsx from "xlsx"; // Ensure you install this: `npm install xlsx`

const masterFilePath = "Example/KAVALON Token allocation report 24.2.68.xlsx";
const sheetName = "Allocation report";
const table_id = "0105561177671";
const intermediary_id = "0105561177671"
const is_update = "F"
const da_asset_short_name = 'KAVALON'
const da_asset_id = 'THDA0000000021'
const is_digital_asset_outstanding = 'T'
const fiat_asset_id = '-'
const da_wallet_address = '0xD387ad5Ea23De2CaF7493992BF60866c16aE3F5D'
const fiat_quantity = '-'
const da_asset_isin = '-'
const customer_code_amlo = '-'


/**
 * Reads an Excel file and extracts data from a specified sheet.
 * @param {string} filePath - Path to the Excel file.
 * @param {string} sheetName - Sheet name to extract data from.
 * @returns {object} Key-value mapping from ID CARD # to da_quantity.
 */
function readMasterExcel(filePath, sheetName) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Master Excel file not found: ${filePath}`);
    return {};
  }

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    console.error(`❌ Sheet "${sheetName}" not found in ${filePath}`);
    return {};
  }

  const jsonData = xlsx.utils.sheet_to_json(sheet);
  console.log(jsonData)
  return Object.fromEntries(jsonData.map(row => [String(row["ID CARD #"]).trim(), String(row["จำนวนโทเคน"]).trim() || "0"]));
}

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
    var processedData = processCusData(customers, fields);
  }
  else if (templateFileName === 'ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processOutStanding(customers, fields);
  }
  else if (templateFileName === 'ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processCusWallet(customers, fields);
  }
  else if (templateFileName === 'ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processIdentification(customers, fields);
  }
  else if (templateFileName === 'ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processProfilePortal(customers, fields);
  }

  const outputFilePath = getOutputFilePath(templateFileName, dbdNo, assetId, yyyymmdd);
  fs.writeFileSync(outputFilePath, [fields.join("|"), ...processedData].join("\n"), "utf-8");

  console.log(`✅ File generated: ${outputFilePath}`);
}

function processCusData(customers, fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processOutStanding(customers, fields) {
  const masterData = readMasterExcel(masterFilePath, sheetName);
  console.log(masterData);

  const processedData = customers.map(customer =>
    fields.map(field => {
      if(field === 'da_asset_short_name'){
        return da_asset_short_name
      }

      if(field === 'da_asset_id'){
        return da_asset_id
      }

      if(field === 'is_digital_asset_outstanding'){
        return is_digital_asset_outstanding
      }

      if(field === 'fiat_asset_id'){
        return fiat_asset_id
      }

      if(field === 'da_wallet_address'){
        return da_wallet_address
      }

      if(field === 'fiat_quantity'){
        return fiat_quantity
      }

      if(field === 'da_asset_isin'){
        return da_asset_isin
      }

      if(field === 'customer_code_amlo'){
        return customer_code_amlo
      }

      if (field === "da_quantity") {
        return masterData[customer.tax_id] || "0"; // Default to "0" if no match
      }

      if (field === "intermediary_id") {
        return intermediary_id
      }

      if (field === "table_id") {
        return table_id
      }

      if (field === "is_update") {
        return is_update
      }

      if (field === "report_date") {
        return report_date
      }

      return customer[field] || ""
    }).join("|")
  );
  return processedData
}

function processCusWallet(customers, fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processIdentification(customers, fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

function processProfilePortal(customers, fields) {
  const processedData = customers.map(customer =>
    fields.map(field => customer[field] || "").join("|")
  );
  return processedData
}

// 🚀 Generate multiple templates dynamically
const dbdNo = 111;
const assetId = 4846;
const yyyymmdd = 20250310;
var report_date = "2025-03-10"

const templates = [
  // "ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  //"ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  //"ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  //"ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv"
];

templates.forEach(template => generateData(template, dbdNo, assetId, yyyymmdd));