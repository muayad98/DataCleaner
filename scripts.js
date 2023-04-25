const extractDataButton = document.getElementById('extractData');
extractDataButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      chrome.tabs.sendMessage(tabId, { action: 'extractData' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        const { extractedData, profilingResults, transformedData, validationResults } = response;
        console.log('Extracted Data:', extractedData);
        console.log('Profiling Results:', profilingResults);
        console.log('Transformed Data:', transformedData);
        console.log('Validation Results:', validationResults);

        try {
          await saveData('extractedData', extractedData);
          await saveData('profilingResults', profilingResults);
          await saveData('transformedData', transformedData);
          await saveData('validationResults', validationResults);
          console.log('Data saved successfully');
        } catch (error) {
          console.error('Error saving data:', error);
        }

        // Display extracted data
        displayExtractedData(extractedData);
      });
    });
  });
});

function saveData(key, data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

function loadData(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}
function displayExtractedData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    const dataContainer = document.getElementById('dataContainer');
    dataContainer.innerHTML = 'No data available';
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Add table header
  const headerRow = document.createElement('tr');
  const sampleRow = data[0];
  const keys = Object.keys(sampleRow);
  keys.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Add table body
  for (const row of data) {
    const tr = document.createElement('tr');
    keys.forEach(key => {
      const td = document.createElement('td');
      const cellData = row[key];

      if (typeof cellData === 'object') {
        const ul = document.createElement('ul');
        for (const itemKey in cellData) {
          const li = document.createElement('li');
          li.textContent = `${itemKey}: ${cellData[itemKey]}`;
          ul.appendChild(li);
        }
        td.appendChild(ul);
      } else {
        td.textContent = cellData;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  // Add the table to the popup
  const dataContainer = document.getElementById('dataContainer');
  if (dataContainer) {
    dataContainer.innerHTML = ''; // Clear any previous content
    dataContainer.appendChild(table);
  }
}






// Add this function to the scripts.js file
function downloadCSV(csvData) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'datacleaner_export.csv';
  link.click();
}

const exportButton = document.getElementById('exportData');
exportButton.addEventListener('click', async () => {
  const extractedData = await loadData('extractedData');
  const headers = Object.keys(extractedData[0]);
  const csvContent = [headers.join(',')].concat(
    extractedData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ).join('\n');
  downloadCSV(csvContent);
});
