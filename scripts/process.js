import fs from "fs";
import path from "path";
import readline from "readline";

// ฟังก์ชันอ่านไฟล์ CSV
async function readCSV(filePath, delimiter = ",") {
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
      headers = fields;
    } else {
      const row = Object.fromEntries(headers.map((header, i) => [header, fields[i] || ""]));
      rows.push(row);
    }
  }
  return rows;
}

async function readTemplateFields(templateFilePath) {
  if (!fs.existsSync(templateFilePath)) {
    console.error(`❌ Template file not found: ${templateFilePath}`);
    return [];
  }

  const stream = fs.createReadStream(templateFilePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    rl.close();
    return line.split("|").map(field => field.trim()); // ใช้ | เป็น delimiter ของ template
  }
  return [];
}

// ฟังก์ชันสร้างไฟล์ ICOPortal_DA_CusData
// export async function generateCusDataTemplate(dbdNo, assetId, yyyymmdd) {
//   const customerFile = "DA-Master/ico_customer_export.csv";
//   const masterFile = "DA-Master/DA_T_Mas_CustomerType.csv";
//   const outputDir = "output";
//   const outputFileName = `ICOPortal_DA_CusData_${dbdNo}_${assetId}_${yyyymmdd}.csv`;
//   const outputFilePath = path.join(outputDir, outputFileName);

//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   // อ่านข้อมูล
//   const customers = await readCSV(customerFile, ",");
//   const customerTypes = await readCSV(masterFile, "|");

//   // Mapping customer_type_code -> customer_type_desc_th
//   const customerTypeMap = Object.fromEntries(
//     customerTypes.map(item => [item.customer_type_code, item.customer_type_desc_th])
//   );

//   // ฟิลด์ที่ต้องการ
//   const fields = [
//     "customer_type", "country", "last_name", "first_name", "is_thai_nationality",
//     "birth_yy", "opening_account_date", "report_date", "nationality", "table_id",
//     "is_update", "customer_code", "intermediary_id", "contact_email_address",
//     "bank_branch_code", "name_title", "bank_account_number", "customer_code_amlo",
//     "customer_id", "middle_name", "tax_id", "bank_short_name"
//   ];

//   // ประมวลผลข้อมูล
//   const processedData = customers.map(customer => {
//     return fields.map(field => {
//       if (field === "customer_type") {
//         return customerTypeMap[customer.customer_type] || "UNKNOWN";
//       }
//       return customer[field] || "";
//     }).join("|");
//   });

//   // เขียนไฟล์
//   fs.writeFileSync(outputFilePath, [fields.join("|"), ...processedData].join("\n"), "utf-8");
//   console.log(`✅ File generated: ${outputFilePath}`);
// }

export async function generateDataTemplate(templateFileName, dbdNo, assetId, yyyymmdd) {
  const customerFile = "DA-Master/ico_customer_export.csv";
  const templateFilePath = path.join("DA-template", templateFileName);
  const outputDir = "output";

  // Generate output filename by replacing placeholders
  const outputFileName = templateFileName
    .replace("{dbdNo}", dbdNo)
    .replace("{assetId}", assetId)
    .replace("{yyyymmdd}", yyyymmdd);
  const outputFilePath = path.join(outputDir, outputFileName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // อ่านข้อมูล
  const customers = await readCSV(customerFile, ",");

  // ดึงฟิลด์จาก template
  const fields = await readTemplateFields(templateFilePath);

  if (fields.length === 0) {
    console.error(`❌ No fields found in template: ${templateFilePath}`);
    return;
  }

  // ประมวลผลข้อมูล
  const processedData = customers.map(customer => {
    return fields.map(field => customer[field] || "").join("|");
  });

  // เขียนไฟล์
  fs.writeFileSync(outputFilePath, [fields.join("|"), ...processedData].join("\n"), "utf-8");
  console.log(`✅ File generated: ${outputFilePath}`);
}

// เรียกใช้ฟังก์ชัน โดยให้ชื่อไฟล์เปลี่ยนไปตามค่าพารามิเตอร์
generateDataTemplate("ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv", 111, 222, 333);
generateDataTemplate("ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv", 111, 222, 333);
generateDataTemplate("ICOPortal_DA_CusWallet_{dbdNo}_{assetId}_{yyyymmdd}.csv", 111, 222, 333);
generateDataTemplate("ICOPortal_DA_Identification_{dbdNo}_{assetId}_{yyyymmdd}.csv", 111, 222, 333);
generateDataTemplate("ICOPortal_DA_ProfilePortal_{dbdNo}_{assetId}_{yyyymmdd}.csv", 111, 222, 333);