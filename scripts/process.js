import fs from "fs";
import path from "path";
import { title } from "process";
import readline from "readline";
import xlsx from "xlsx"; // Ensure you install this: `npm install xlsx`

const masterFilePath = "Example/KAVALON Token allocation report 24.2.68.xlsx";
const sheetName = "Allocation report";
const table_id = "0105561177671;THDA0000000021;";
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
var countries, nationalities, titles, banks, locations, businessTypes
var report_date = "2025-03-10"
var register_date = '2025-02-25'

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

async function getLocationMapping() {
  const file = "DA-Master/DA_T_Mas_Location.csv";
  return await readCSV(file, "|"); // Read as pipe-delimited
}

async function getIntialCustomer() {

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
  locations = await getLocationMapping();
  businessTypes = getBusinessType();
  const customers = await getCustomerData();
  const templateFilePath = path.join("DA-template", templateFileName);
  const fields = await readTemplateFields(templateFilePath);
  const initialCustomers = readMasterExcel(masterFilePath, "Allocation report");

  // console.log(initialCustomers)
  if (fields.length === 0) {
    console.error(`❌ No fields found in template: ${templateFilePath}`);
    return;
  }

  // Process data based on template fields
  if (templateFileName === 'ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processCusData(customers, fields, initialCustomers);
  }
  else if (templateFileName === 'ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processOutStanding(customers, fields, initialCustomers);
  }
  else if (templateFileName === 'ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processCusWallet(customers, fields, initialCustomers);
  }
  else if (templateFileName === 'ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processIdentification(customers, fields, initialCustomers);
  }
  else if (templateFileName === 'ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv') {
    var processedData = processProfilePortal(fields);
  }

  const outputFilePath = getOutputFilePath(templateFileName, dbdNo, assetId, yyyymmdd);
  fs.writeFileSync(outputFilePath, [fields.join("|"), ...processedData].join("\n"), "utf-8");

  console.log(`✅ File generated: ${outputFilePath}`);
}

function processCusData(customers, fields, initialCustomers) {

  const processedData = initialCustomers.map(customer => {
    const existCustomer = customers.find(x => {
      const masterId = String(customer['ID CARD #']).trim();
      const customerId = String(x.tax_id).trim();
      return masterId === customerId;
    });
    // console.log(existCustomer)

    return fields.map(field => {

      if (customer['ID CARD #'].trim() == '0125545001483') {
        if (field == 'customer_type') return '21'
        if (field == 'country') return '0102100218'
        if (field == 'last_name') return 'บริษัท เอเชียมาร์ท เอ็กซ์ปอร์ต จำกัด;ASIA MART EXPORT COMPANY LIMITED'
        if (field == 'fist_name') return '-'
        if (field == 'is_thai_nationality') return 'T'
        if (field == 'birth_yy') return '2002'
        if (field == 'opening_account_date') return '2025-02-23'
        if (field == 'report_date') return '2025-03-10'
        if (field == 'nationality') return '0106200072'
        if (field == 'table_id') return table_id
        if (field == 'is_update') return 'F'
        if (field == 'customer_code') return '212500002'
        if (field == 'contact_email_address') return 'nukul.asia@gmail.com'
        if (field == 'bank_branch_code') return '-'
        if (field == 'name_title') return '0101600001'
        if (field == 'bank_account_number') return ''
        if (field == 'customer_code_amlo') return '-'
        if (field == 'customer_id') return '0125545001483'
        if (field == 'middle_name') return '-'
        if (field == 'tax_id') return '0125545001483'
        if (field == 'bank_short_name') return '-'
      }

      if (customer['ID CARD #'].trim() == '0105564058061') {
        if (field == 'customer_type') return '21'
        if (field == 'country') return '0102100218'
        if (field == 'last_name') return 'บริษัท เอ็กซ์สปริง แอดวานซ์ โซลูชั่น จำกัด;XSPRING ADVANCE SOLUTIONS COMPANY LIMITED'
        if (field == 'fist_name') return '-'
        if (field == 'is_thai_nationality') return 'T'
        if (field == 'birth_yy') return '2021'
        if (field == 'opening_account_date') return '2025-02-23'
        if (field == 'report_date') return '2025-03-10'
        if (field == 'nationality') return '0106200073'
        if (field == 'table_id') return '0105561177671'
        if (field == 'is_update') return 'F'
        if (field == 'customer_code') return '212500001'
        if (field == 'contact_email_address') return 'amorna@xspringcapital.com'
        if (field == 'bank_branch_code') return '-'
        if (field == 'name_title') return '0101600001'
        if (field == 'bank_account_number') return ''
        if (field == 'customer_code_amlo') return '-'
        if (field == 'customer_id') return '0105564058061'
        if (field == 'middle_name') return '-'
        if (field == 'tax_id') return '0105564058061'
        if (field == 'bank_short_name') return '-'
      }

      if (field == 'country' && existCustomer) {
        const result = countries.filter(country => country.country_full_name_en.toLowerCase().includes(existCustomer[field].toLowerCase()));
        return result[0]?.country_code || "-"
      }

      if (field == 'is_thai_nationality' && existCustomer && existCustomer.nationality == 'THAI') {
        return "T"
      } else if (field == 'is_thai_nationality' && existCustomer && existCustomer.nationality != 'THAI') {
        return "F"
      }

      if (field == 'opening_account_date' && existCustomer) {
        return existCustomer[field].substring(0, 10);
      }

      if (field == 'report_date') {
        return report_date
      }

      if (field == 'nationality' && existCustomer) {
        const result = nationalities.filter(nationality => nationality.nationality_name_en.toLowerCase() == existCustomer[field].toLowerCase());
        return result[0]?.nationality_code || ""
      }

      if (field == 'table_id' || field == 'intermediary_id') {
        return '0105561177671'
      }

      if (field == 'is_update') {
        return 'F'
      }

      if (field == 'name_title' && existCustomer) {
        if (existCustomer[field].toLowerCase() == 'other') return '0101699998'
        const result = titles.filter(title => title.title_name_en.toLowerCase() == existCustomer[field].toLowerCase());
        return result[0]?.title_code || '-'
      }

      if (field == 'customer_code_amlo') {
        return '-'
      }

      if (field == 'customer_id') {
        return customer['ID CARD #']
      }

      if (field == 'bank_short_name' && existCustomer) {
        const result = banks.filter(bank => bank.bank.toLowerCase() == existCustomer[field].toLowerCase());
        return result[0]?.bank_short_name || '-'
      }

      return existCustomer ? existCustomer[field] || '-' : '-';
    }).join("|")
  });

  // console.log(processedData);
  return processedData
}

function processOutStanding(customers, fields, initialCustomers) {
  const processedData = initialCustomers.map(customer => {
    const existCustomer = customers.find(x => {
      const masterId = String(customer['ID CARD #']).trim();
      const customerId = String(x.tax_id).trim();
      return masterId === customerId;
    });

    return fields.map(field => {
      if (field === 'da_asset_short_name') {
        return da_asset_short_name;
      }

      if (field === 'da_asset_id') {
        return da_asset_id;
      }

      if (field === 'is_digital_asset_outstanding') {
        return is_digital_asset_outstanding;
      }

      if (field === 'fiat_asset_id') {
        return fiat_asset_id;
      }

      if (field === 'da_wallet_address') {
        return da_wallet_address;
      }

      if (field === 'fiat_quantity') {
        return fiat_quantity;
      }

      if (field === 'da_asset_isin') {
        return da_asset_isin;
      }

      if (field === 'customer_code_amlo') {
        return customer_code_amlo;
      }

      if (field === "da_quantity") {
        console.log(customer)
        return customer['จำนวนเงิน'] || "0";
      }

      if (field === "intermediary_id") {
        return intermediary_id;
      }

      if (field === "table_id") {
        return table_id;
      }

      if (field === "is_update") {
        return is_update;
      }

      if (field === "report_date") {
        return report_date;
      }

      if (field === 'customer_type') {
        if (customer['ID CARD #'] === '0125545001483' || customer['ID CARD #'] === '0105564058061') {
          return '21'
        }
        else {
          existCustomer[field]
        }
      }

      if (field === 'customer_code') {
        if (customer['ID CARD #'] === '0125545001483') {
          return '212500002'
        }
        else if (customer['ID CARD #'] === '0105564058061') {
          return '212500001'
        }

        return existCustomer[field]
      }

      if (field === 'customer_status') {
        if (customer['ID CARD #'] === '0125545001483' || customer['ID CARD #'] === '0105564058061') {
          return 'OT'
        }

        return existCustomer[field]
      }


      return existCustomer ? existCustomer[field] || "" : "";
    }).join("|");
  });

  return processedData;
}

function processCusWallet(customers, fields, initialCustomers) {
  // console.log(fields);
  var walletData = readMasterExcel('Example/KAVALON-DAMAS.xlsx', 'CusWallet');

  const processedData = initialCustomers.map(customer => {
    const existCustomer = customers.find(x => {
      const masterId = String(customer['ID CARD #']).trim();
      const customerId = String(x.tax_id).trim();
      return masterId === customerId;
    });
    return fields.map(field => {

      // if (field === 'da_wallet_address') {
      //   return da_wallet_address;
      // }

      // if (field === 'asset_id') {
      //   return da_asset_id;
      // }

      if (field === 'register_date') {
        return register_date;
      }

      // if (field === 'asset_short_name') {
      //   return da_asset_short_name;
      // }

      // if (field === 'business_wallet_flag_detail' || field === 'asset_isin') {
      //   return '-'
      // }

      // if (field === 'business_wallet_flag') {
      //   return '01'
      // }

      // if (field === 'is_deposit_wallet') {
      //   return 'F'
      // }

      // if (field === 'wallet_issuer') {
      //   return 'Xspring_Digital'
      // }

      if (field === 'customer_code') {

        if (customer['ID CARD #'] === '0125545001483') {
          return '212500002'
        }
        else if (customer['ID CARD #'] === '0105564058061') {
          return '212500001'
        }

        return existCustomer[field]
      }

      if (field === 'report_date') {
        return report_date
      }

      return walletData ? walletData[0][field] || "" : ""
    }).join("|")
  });
  return processedData
}

function processIdentification(customers, fields, initialCustomers) {
  const processedData = initialCustomers.map(customer => {
    const existCustomer = customers.find(x => {
      const masterId = String(customer['ID CARD #']).trim();
      const customerId = String(x.tax_id).trim();
      return masterId === customerId;
    });
    return fields.map(field => {
      if (customer['ID CARD #'].trim() == '0125545001483') { //เอเชียมาร์ท
        if (field == 'contact_address_district'
          || field == 'contact_address_province'
          || field == 'id_address_sub_district'
          || field == 'contact_address_sub_district'
          || field == 'id_address_district'
          || field == 'id_address_province'
        ) {
          return '0103800319'
        }

        if (field == 'nationality') return '0106200072'
        if (field == 'contact_email_address') return 'nukul.asia@gmail.com'
        if (field == 'customer_code_amlo') return '-'
        if (field == 'customer_code') return '212500002'
        if (field == 'customer_id') return '0125545001483'
        if (field == 'contact_address_road') return '18/13-14 ม.5  ถนนบางกรวย-ไทรน้อย'
        if (field == 'opening_service_location_country') return '0102100218'
        if (field == 'birth_yy') return '2002'
        if (field == 'opening_account_date') return '2025-02-23'
        if (field == 'customer_status') return 'OT'
        if (field == 'knowledge_test_date') return '2025-02-21'
        if (field == 'customer_type') return '21'
        if (field == 'knowledge_test_status') return 'KT01'
        if (field == 'country') return '0102100218'
        if (field == 'workplace') return 'บ้าน'
        if (field == 'business_type_detail') return 'Trading Export'
        if (field == 'business_type') return '999'
        if (field == 'occupation') return '999'
        if (field == 'occupation_detail') return 'อื่น ๆ'
      }

      if (customer['ID CARD #'].trim() == '0105564058061') { //xspring
        if (field == 'contact_address_district'
          || field == 'contact_address_province'
          || field == 'id_address_sub_district'
          || field == 'contact_address_sub_district'
          || field == 'id_address_district'
          || field == 'id_address_province'
        ) {
          return '0103800191'
        }

        if (field == 'nationality') return '0106200072'
        if (field == 'contact_email_address') return 'amorna@xspringcapital.com'
        if (field == 'customer_code_amlo') return '-'
        if (field == 'customer_code') return '212500001'
        if (field == 'customer_id') return '0105564058061'
        if (field == 'contact_address_road') return '59 สิริแคมปัสอาคารดี ชั้น2'
        if (field == 'opening_service_location_country') return '0102100218'
        if (field == 'birth_yy') return '2021'
        if (field == 'opening_account_date') return '2025-02-23'
        if (field == 'customer_status') return 'OT'
        if (field == 'knowledge_test_date') return '2025-02-21'
        if (field == 'customer_type') return '21'
        if (field == 'knowledge_test_status') return 'KT01'
        if (field == 'country') return '0102100218'
        if (field == 'business_type_detail') return 'Investment'
        if (field == 'business_type') return '999'
        if (field == 'occupation') return '999'
        if (field == 'occupation_detail') return 'อื่น ๆ'
      }

      if (existCustomer && (field == 'contact_address_district'
        || field == 'contact_address_province'
        || field == 'id_address_sub_district'
        || field == 'contact_address_sub_district'
        || field == 'id_address_district'
        || field == 'id_address_province'
      )
      ) {
        const result = locations.filter(location => location.sub_district_name_en.toLowerCase() == existCustomer.contact_address_sub_district.toLowerCase());

        if (existCustomer.contact_address_sub_district.trim() == 'Samsen Nai') return '0103800073'
        else if (existCustomer.contact_address_sub_district.trim() == 'Phra Khanong Nua') return '0103800191'
        else if (existCustomer.contact_address_sub_district.trim() == 'Suan Phrik Thai') return '0103800361'
        else if (existCustomer.contact_address_sub_district.trim() == 'Sam Wa Tawantok') return '0103800215'
        else if (existCustomer.contact_address_sub_district.trim() == 'Bang Kae Nua') return '0103800194'
        else if (existCustomer.contact_address_sub_district.trim() == 'Sao Thong Hin') return '0103800314'
        else if (existCustomer.contact_address_sub_district.trim() == 'Khlong Chao Khun Sing') return '0103800212'
        else if (existCustomer.contact_address_sub_district.trim() == 'Ta Khli') return '0103805761'
        else if (existCustomer.contact_address_sub_district.trim() == 'Phimonrat') return '0103800324'
        else if (existCustomer.contact_address_sub_district.trim() == 'Khlong Kluea') return '0103800346'
        else if (existCustomer.contact_address_sub_district.trim() == 'Phrabat') return '0103805104'
        else if (existCustomer.contact_address_sub_district.trim() == 'Khlong Tan Nua') return '0103800190'
        else if (existCustomer.contact_address_sub_district.trim() == 'Khlong Toei Nua') return '0103800189'

        return result[0]?.location_code || "**" + existCustomer.contact_address_sub_district
      }

      if (field == 'table_id') {
        return table_id
      }

      if (field == 'intermediary_id') {
        return '0105561177671'
      }

      if (field == 'is_update') {
        return 'F'
      }

      if (field == 'business_type_detail' && existCustomer) {
        if (existCustomer.business_type == 'อื่น ๆ') return existCustomer.business_type_detail || 'อื่น ๆ'
        else return existCustomer.business_type || 'อื่น ๆ'
      }

      if (field == 'business_type' && existCustomer) {
        const result = businessTypes.filter(business => business.detail == existCustomer.business_type);
        return result[0]?.type || '999'
      }

      if (field == 'nationality' && existCustomer) {
        const result = nationalities.filter(nationality => nationality.nationality_name_en.toLowerCase() == existCustomer[field].toLowerCase());
        return result[0]?.nationality_code || '-'
      }

      if (field == 'report_date') {
        return '2025-03-10'
      }

      if ((field == 'opening_service_location_country' || field == 'country') && existCustomer) {
        const result = countries.filter(country => country.country_full_name_en.toLowerCase().includes(existCustomer.country.toLowerCase()));
        return result[0]?.country_code || '-'
      }

      if (field == 'opening_account_date' && existCustomer) {
        return existCustomer[field].substring(0, 10);
      }

      if (field == 'is_thai_nationality' && existCustomer && existCustomer.nationality == 'THAI') {
        return "T"
      } else if (field == 'is_thai_nationality' && existCustomer && existCustomer.nationality != 'THAI') {
        return "F"
      }

      if (field == 'education_level') {
        return '99'
      }

      if (field == 'opening_service_location_province') {
        return '0103800191'
      }

      if (field == 'contact_address_country' || field == 'id_address_country') {
        return '0102100218'
      }

      if (field == 'knowledge_test_status') {
        return 'KT01'
      }

      if (field == 'occupation') {
        if (existCustomer && existCustomer[field] === '50') {
          return '999'
        }
        return existCustomer ? existCustomer[field] || '-' : '-'
      }

      if (field == 'occupation_detail') {
        if (existCustomer && existCustomer['occupation'] === '50') {
          return 'อื่นๆ'
        }
        return existCustomer ? existCustomer[field] || 'อื่น ๆ' : 'อื่น ๆ'
      }

      if (field == 'workplace') {
        if (!existCustomer || String(existCustomer[field]).trim() == '') {
          return 'บ้าน'
        }
        if (existCustomer[field] == '-'){
            return 'บ้าน'
        }
        return existCustomer[field]
      }

      if (existCustomer && field == 'contact_address_road') {
        if (existCustomer[field] == '') return existCustomer['contact_free_text_address']
        return existCustomer['contact_free_text_address'] + ' ' + existCustomer[field];
      }



      return existCustomer ? existCustomer[field] || '-' : '-'
    }).join("|")
  });

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

function getBusinessType() {
  return [
    {
      detail: 'ประกันภัย/ประกันชีวิต',
      type: '103'
    },
    {
      detail: 'ข้าราชการตำรวจ/ทหาร',
      type: '101'
    },
    {
      detail: 'อื่น ๆ (โปรดระบุ)',
      type: '999'
    },
    {
      detail: 'การเงิน/ธนาคาร',
      type: '104'
    },
    {
      detail: 'อสังหาริมทรัพย์',
      type: '105'
    },
    {
      detail: 'มหาวิทยาลัย/โรงเรียน/สถานศึกษา',
      type: '101'
    },
    {
      detail: 'โรงแรม/ภัตตาคาร',
      type: '999'
    },
  ]
}


// 🚀 Generate multiple templates dynamically
const dbdNo = '0105561177671';
const assetId = 'THDA0000000021';
const yyyymmdd = 20250310;


const templates = [
  //  "ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  //  "ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  //"ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  "ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv",
  // "ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv"
];

templates.forEach(template => generateData(template, dbdNo, assetId, yyyymmdd));