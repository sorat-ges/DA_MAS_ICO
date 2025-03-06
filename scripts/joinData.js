import fs from "fs";
import path from "path";

// Function to get the template file
function getTemplateFile(dbdNo, assetId) {
  // Generate today's date in YYYYMMDD format
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  
  // Define the template directory
  const templateDir = "DA-template";

  // Generate the full filename based on the format
  const filename = `ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv`;
  const filePath = path.join(templateDir, filename);

  // Check if the template file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Template file not found: ${filePath}`);
    return null;
  }

  console.log(`✅ Found template file: ${filePath}`);
  return filePath;
}

// Function to process CSV
function processCSV() {
  console.log("OK");

  // Example: Fetching template file with dbdNo = "12345", assetId = "BTC"
  const templateFile = getTemplateFile("12345", "BTC");

  if (templateFile) {
    // Read the template file
    const fileContent = fs.readFileSync(templateFile, "utf-8");
    console.log("🔹 Template Content:");
    console.log(fileContent);
  }
}

// Run the program
processCSV();
