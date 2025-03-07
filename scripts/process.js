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
var countries, nationalities, titles,banks


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

  return jsonData.map(item => {
    return Object.fromEntries(
      Object.entries(item).map(([key, value]) => {
        return [key.replace(/['"]/g, ''), value]; // Remove quotes from keys
      })
    );
  });
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

async function getCountryMapping() {
  const file = "DA-Master/DA_T_Mas_Country.csv";
  return await readCSV(file, "|"); // Read as pipe-delimited
}

async function getNationalityMapping() {
  const file = "DA-Master/DA_T_Mas_Nationality.csv";
  return await readCSV(file, "|"); // Read as pipe-delimited
}

async function getTitleMapping() {
  const file = "DA-Master/DA_T_Mas_Title.csv";
  return await readCSV(file, "|"); // Read as pipe-delimited
}

/**
 * Generates a data file based on a given template.
 * @param {string} templateFileName - The template filename with placeholders.
 * @param {number} dbdNo - Database number.
 * @param {number} assetId - Asset ID.
 * @param {number} yyyymmdd - Date in YYYYMMDD format.
 */
export async function generateData(templateFileName, dbdNo, assetId, yyyymmdd) {
  countries = await getCountryMapping();
  nationalities = await getNationalityMapping();
  titles = await getTitleMapping();
  banks = getBanks();
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
    var processedData = processProfilePortal(fields);
  }

  const outputFilePath = getOutputFilePath(templateFileName, dbdNo, assetId, yyyymmdd);
  fs.writeFileSync(outputFilePath, [fields.join("|"), ...processedData].join("\n"), "utf-8");

  console.log(`✅ File generated: ${outputFilePath}`);
}

function processCusData(customers, fields) {
  const processedData = customers.map(customer =>
    fields.map(field => {
      if (field == 'country') {
        const result = countries.filter(country =>
          country.country_full_name_en.toLowerCase().includes(customer[field].toLowerCase())
        );
        return result[0]?.country_code || ""
      }

      if (field == 'is_thai_nationality' && customer.nationality == 'THAI') {
        return "T"
      } else if (field == 'is_thai_nationality' && customer.nationality != 'THAI') {
        return "F"
      }

      if (field == 'opening_account_date') {
        return customer[field].substring(0, 10);
      }

      if (field == 'report_date') {
        return '2025-03-10'
      }

      if (field == 'nationality') {
        const result = nationalities.filter(nationality =>
          nationality.nationality_name_en.toLowerCase().includes(customer[field].toLowerCase())
        );
        return result[0]?.nationality_code || ""
      }

      if (field == 'table_id' || field == 'intermediary_id') {
        return '0105561177671'
      }

      if (field == 'is_update') {
        return 'F'
      }

      if (field == 'name_title') {
        const result = titles.filter(title =>
          title.title_name_en.toLowerCase().includes(customer[field].toLowerCase())
        );
        return result[0]?.title_code || "-"
      }

      if (field == 'customer_code_amlo') {
        return '-'
      }

      if (field == 'customer_id') {
        return customer.tax_id
      }

      if (field == 'bank_short_name') {
        const result = banks.filter(bank =>
          bank.bank.toLowerCase().includes(customer[field].toLowerCase())
        );
        return result[0]?.bank_short_name || "-"
      }

      return customer[field] || "-";
    }).join("|")
  );

  console.log(processedData);
  return processedData
}

function processOutStanding(customers, fields) {
  const masterData = readMasterExcel(masterFilePath, sheetName);
  // console.log(masterData[0]['จำนวนโทเคน']);

  const processedData = customers.map(customer =>
    fields.map(field => {
      if (field === 'da_asset_short_name') {
        return da_asset_short_name
      }

      if (field === 'da_asset_id') {
        return da_asset_id
      }

      if (field === 'is_digital_asset_outstanding') {
        return is_digital_asset_outstanding
      }

      if (field === 'fiat_asset_id') {
        return fiat_asset_id
      }

      if (field === 'da_wallet_address') {
        return da_wallet_address
      }

      if (field === 'fiat_quantity') {
        return fiat_quantity
      }

      if (field === 'da_asset_isin') {
        return da_asset_isin
      }

      if (field === 'customer_code_amlo') {
        return customer_code_amlo
      }

      if (field === "da_quantity") {

        const result = masterData.find(x => {
          const masterId = String(x['ID CARD #']).trim();
          const customerId = String(customer.tax_id).trim();
          // console.log(`Comparing: "${masterId}" with "${customerId}"`); // Debugging
          return masterId === customerId;
      });
  

        return result ? result['จำนวนเงิน'] || "0":"0"; // Default to "0" if no match
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

function processProfilePortal(fields) {
  const profilePortal = readMasterExcel("Example/KAVALON-DAMAS.xlsx", "ProfilePortal")
  const processedData = profilePortal.map(data =>
    fields.map(field => data[field] || "").join("|")
  );
  return processedData
}

 
function getBanks() {
  return [
    {
      bank: 'SCB',
      bank_short_name: 'SICOTHBK'
    },
    {
      bank: 'TMB',
      bank_short_name: 'TMBKTHBK'
    },
    {
      bank: 'KBANK',
      bank_short_name: 'KASITHBK'
    },
    {
      bank: 'BBL',
      bank_short_name: 'BKKBTHBK'
    },
    {
      bank: 'KTB',
      bank_short_name: 'KRTHTHBK'
    },
    {
      bank: 'TCRB',
      bank_short_name: 'KRTHTHBK'
    },
    {
      bank: 'KK',
      bank_short_name: 'KKPBTHBK'
    },
    {
      bank: 'GSB',
      bank_short_name: 'GSBATHBK'
    },
    {
      bank: 'BAY',
      bank_short_name: 'AYUDTHBK'
    },
    {
      bank: 'CIMBT',
      bank_short_name: 'UBOBTHBK'
    },
    {
      bank: 'UOBT',
      bank_short_name: 'UOVBTHBK'
    },
    {
      bank: 'LH BANK',
      bank_short_name: 'LAHRTHB2'
    },
  ]
}
 

// 🚀 Generate multiple templates dynamically
const dbdNo = 111;
const assetId = 4846;
const yyyymmdd = 20250310;
var report_date = "2025-03-10"

const templates = [
  // "ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  // "ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  // "ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  // "ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv"
];

templates.forEach(template => generateData(template, dbdNo, assetId, yyyymmdd));