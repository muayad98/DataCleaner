// content.js
function extractTableData(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  const headerRow = rows.shift();
  const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());

  const data = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const paddedCells = cells.concat(Array(headers.length - cells.length).fill(''));

    return headers.reduce((obj, header, index) => {
      obj[header] = paddedCells[index] ? paddedCells[index].textContent.trim() : '';
      return obj;
    }, {});
  });

  return data;
}


function extractData() {
  const tables = Array.from(document.querySelectorAll('table'));
  const extractedData = tables.map(table => extractTableData(table));
  return extractedData;
}

function profileData(data) {
  const profilingResults = {
    totalTables: data.length,
    totalRows: 0,
    missingValues: 0,
    columnStats: {}
  };

  data.forEach((table) => {
    profilingResults.totalRows += table.length;
    table.forEach((row) => {
      for (const columnName in row) {
        if (!profilingResults.columnStats[columnName]) {
          profilingResults.columnStats[columnName] = {
            uniqueValues: new Set(),
            emptyValues: 0
          };
        }

        const cellValue = row[columnName];
        if (cellValue === '') {
          profilingResults.missingValues++;
          profilingResults.columnStats[columnName].emptyValues++;
        } else {
          profilingResults.columnStats[columnName].uniqueValues.add(cellValue);
        }
      }
    });
  });

  // Convert unique value sets to counts
  for (const columnName in profilingResults.columnStats) {
    profilingResults.columnStats[columnName].uniqueValues = profilingResults.columnStats[columnName].uniqueValues.size;
  }

  return profilingResults;
}

function fillMissingValues(table, defaultValue = '') {
  return table.map(row => {
    for (const columnName in row) {
      if (row[columnName] === '') {
        row[columnName] = defaultValue;
      }
    }
    return row;
  });
}

function convertTextToLowerCase(table) {
  return table.map(row => {
    for (const columnName in row) {
      row[columnName] = row[columnName].toLowerCase();
    }
    return row;
  });
}

function removeDuplicateRows(table) {
  const seenRows = new Set();
  const uniqueRows = [];

  table.forEach(row => {
    const rowString = JSON.stringify(row);
    if (!seenRows.has(rowString)) {
      seenRows.add(rowString);
      uniqueRows.push(row);
    }
  });

  return uniqueRows;
}
function transformData(data, transformations) {
  return data.map((table, index) => {
    let transformedTable = table;

    if (transformations.fillMissingValues) {
      transformedTable = fillMissingValues(transformedTable, transformations.defaultValue);
    }

    if (transformations.convertTextToLowerCase) {
      transformedTable = convertTextToLowerCase(transformedTable);
    }

    if (transformations.removeDuplicateRows) {
      transformedTable = removeDuplicateRows(transformedTable);
    }

    return transformedTable;
  });
}

function validateData(data, rules) {
  const validationResults = data.map((row, rowIndex) => {
    const rowValidationResults = {};

    for (const columnName in rules) {
      const rule = rules[columnName];
      const value = row[columnName];

      if (rule.required && (value === null || value === undefined || value === '')) {
        rowValidationResults[columnName] = `Value is required (Row: ${rowIndex + 1}, Column: ${columnName})`;
      } else if (
        rule.min !== undefined &&
        rule.max !== undefined &&
        (value < rule.min || value > rule.max)
      ) {
        rowValidationResults[columnName] = `Value should be between ${rule.min} and ${rule.max} (Row: ${rowIndex + 1}, Column: ${columnName})`;
      }
    }

    return rowValidationResults;
  });

  return validationResults;
}

const validationRules = {
  age: {
    required: true,
    min: 1,
    max: 100,
  },
  score: {
    required: true,
    min: 0,
    max: 100,
  },
};

function dataToCSV(tables) {
  if (!tables || !tables.length) return '';

  // Process each table separately and join them with an empty line
  const tablesCSV = tables.map(table => {
    if (!table.length) return '';

    const headers = Object.keys(table[0]).join(',');
    const rows = table.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');
    const csvData = `${headers}\n${rows}`;

    return csvData;
  }).join('\n\n');

  return tablesCSV;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractData();
    const profilingResults = profileData(data);
    const transformedData = transformData(data, profilingResults);
    const validationResults = validateData(transformedData, validationRules);
    sendResponse({ extractedData: data, profilingResults, transformedData, validationResults });
  } else if (request.action === 'exportData') {
    const data = extractData();
    const profilingResults = profileData(data);
    const transformedData = transformData(data, profilingResults);
    const validationResults = validateData(transformedData, validationRules);
    const csvData = dataToCSV(transformedData);
    sendResponse({ csvData });
  }
  return true; // Keep the message channel open for asynchronous responses
});
// gi




