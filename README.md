# Data Processing and File Generation Script

## Overview
This script processes customer and financial data from Excel and CSV files, applies transformations based on predefined templates, and generates output files in a specified format.

## Prerequisites
Before running the script, ensure you have the following installed:
- Node.js (latest LTS version recommended)
- Required npm packages:
  ```sh
  npm install xlsx
  ```

  

## File Structure
```
project-root/
├── DA-Master/                    # Directory containing master data files
│   ├── ico_customer_export_pipe.csv
│   ├── DA_T_Mas_Country.csv
│   ├── DA_T_Mas_Nationality.csv
│   ├── DA_T_Mas_Title.csv
│   ├── DA_T_Mas_Location.csv
├── DA-template/                  # Directory containing template files
│   ├── ICOPortal_DA_CusData_{dbdNo}_{assetId}_{yyyymmdd}.csv
│   ├── ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv
├── Example/                      # Example input files
│   ├── KAVALON Token allocation report 24.2.68.xlsx
│   ├── KAVALON-DAMAS.xlsx
├── output/                       # Generated output files
├── script.js                      # Main script file
```

## Configuration
Several global variables are defined at the top of the script for customization:
- `masterFilePath`: Path to the master Excel file containing token allocation data.
- `table_id`, `intermediary_id`: Identifiers used in generated files.
- `report_date`, `register_date`: Dates used for report generation.
- `da_asset_short_name`, `da_asset_id`: Digital asset information.

## Functions
### Data Reading Functions
- `readMasterExcel(filePath, sheetName)`: Reads an Excel file and extracts data from a given sheet.
- `readCSV(filePath, delimiter)`: Reads a CSV file and returns parsed data as an array of objects.
- `readTemplateFields(templateFilePath)`: Reads a template file and extracts field names.

### Data Processing Functions
- `processCusData(customers, fields, initialCustomers)`: Processes customer data and maps fields based on rules.
- `processOutStanding(customers, fields, initialCustomers)`: Processes outstanding digital asset records.
- `processCusWallet(customers, fields, initialCustomers)`: Processes wallet-related information.
- `processIdentification(customers, fields, initialCustomers)`: Processes customer identification details.
- `processProfilePortal(fields)`: Reads and processes profile data from an Excel sheet.

### Utility Functions
- `getOutputFilePath(templateFileName, dbdNo, assetId, yyyymmdd)`: Generates an output file path based on the template name.
- `getCustomerData()`, `getCountryMapping()`, `getNationalityMapping()`, etc.: Load lookup data from CSV files.

## Execution
To generate the required output files, run:
```sh
npm run dev
```

The script processes multiple templates:
```js
const templates = [
    "ICOPortal_DA_CusOutstanding_{dbdNo}_{assetId}_{yyyymmdd}.csv",
];

templates.forEach(template => generateData(template, dbdNo, da_asset_id, yyyymmdd));
```

## Output
Generated files will be stored in the `output/` directory with formatted names according to the template placeholders.

## Notes
- Ensure that the required data files exist before running the script.
- Modify the template processing functions as needed to meet specific business logic requirements.
- Error handling is included to check for missing files and sheets.

## Contact
For any issues, reach out to the development team or create an issue in the repository.

