import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";

// ฟังก์ชันแปลง CSV delimiter จาก `,` -> `|`
async function convertCSVDelimiter(inputFilePath, outputFilePath) {
  if (!fs.existsSync(inputFilePath)) {
    console.error(`❌ File not found: ${inputFilePath}`);
    return;
  }

  const inputStream = fs.createReadStream(inputFilePath);
  const outputStream = fs.createWriteStream(outputFilePath);

  // ใช้ `csv-parse` เพื่ออ่านไฟล์ CSV โดยคงค่าที่อยู่ใน double quotes
  const parser = parse({
    columns: true, // ใช้ header เป็น key
    relax_quotes: true, // อนุญาตให้มี quote ภายใน
    skip_empty_lines: true, // ข้ามบรรทัดว่าง
    trim: true, // ตัด space หน้าและหลัง
  });

  // ใช้ `csv-stringify` เพื่อเขียนออกไปเป็น pipe-delimited
  const stringifier = stringify({
    header: true,
    delimiter: "|", // เปลี่ยนเป็น pipe
  });

  inputStream.pipe(parser).pipe(stringifier).pipe(outputStream);

  outputStream.on("finish", () => {
    console.log(`✅ File converted: ${outputFilePath}`);
  });
}

// เรียกใช้งานฟังก์ชัน
const inputCSV = "DA-Master/ico_customer_export-2.csv"; // ไฟล์ input
const outputCSV = "DA-Master/ico_customer_export_pipe.csv"; // ไฟล์ output

convertCSVDelimiter(inputCSV, outputCSV);
