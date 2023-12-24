document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const fileType = document.getElementById("fileType");
    const encoding = document.getElementById("encoding");
    const delimiter = document.getElementById("delimiter");
    const hasHeader = document.getElementById("hasHeader");
    const availableFields = document.getElementById("availableFields");
    const displayFields = document.getElementById("displayFields");
    const addButton = document.getElementById("addButton");
    const removeButton = document.getElementById("removeButton");
    const downloadButton = document.getElementById("downloadButton");
    const displayButton = document.getElementById("displayButton");
    const fileTypeError = document.getElementById("fileTypeError");
    let rawData;

    fileInput.addEventListener("change", handleFile);
    addButton.addEventListener("click", moveField);
    removeButton.addEventListener("click", moveField);
    downloadButton.addEventListener("click", downloadJSON);
    displayButton.addEventListener("click", displayData);

    function handleFile(event) {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const result = e.target.result;

                try {
                    rawData = parseFile(result, fileType.value);
                    fileTypeError.textContent = "";
                    updateSelectFields(rawData);
                } catch (error) {
                    fileTypeError.textContent = "Error parsing the file.";
                }
            };

            reader.readAsText(file, encoding.value);
        }
    }

    function parseFile(data, type) {
        if (type === "json") {
            return parseJSON(data);
        } else if (type === "csv") {
            return parseCSV(data);
        } else {
            throw new Error("Unsupported file type");
        }
    }

    function parseJSON(data) {
        const jsonData = JSON.parse(data);
        const products = jsonData.products;

        const result = Object.keys(products).map(key => {
            const product = products[key];
            return {
                subcategory: product.subcategory,
                title: product.title,
                price: parseInt(product.price),
                popularity: parseInt(product.popularity)
            };
        });

        return result;
    }

    function parseCSV(data) {
        const lines = data.split('\n');
        const headers = lines[0].split(delimiter.value);

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(delimiter.value);
            const entry = {};

            headers.forEach((header, index) => {
                entry[header.trim()] = currentLine[index].trim();
            });

            result.push(entry);
        }

        return result;
    }

    function updateSelectFields(data) {
        availableFields.innerHTML = "";
        displayFields.innerHTML = "";

        const fields = getColumns(data);

        fields.forEach(field => {
            const option = document.createElement("option");
            option.value = field;
            option.textContent = field;
            availableFields.appendChild(option);
        });
    }

    function getColumns(data) {
        if (fileType.value === "csv") {
            const firstRow = data[0];
            return Object.keys(firstRow);
        } else {
            const firstEntry = data[0];
            return Object.keys(firstEntry);
        }
    }

    function moveField() {
        const source = this.id === "addButton" ? availableFields : displayFields;
        const destination = this.id === "addButton" ? displayFields : availableFields;

        for (let i = 0; i < source.options.length; i++) {
            const option = source.options[i];

            if (option.selected) {
                destination.appendChild(option.cloneNode(true));
                source.remove(i);
                i--;
            }
        }
    }

    function downloadJSON() {
        const apiUrl = "https://s3.amazonaws.com/open-to-cors/assignment.json";

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const jsonContent = JSON.stringify(data, null, 2);

                const blob = new Blob([jsonContent], { type: 'application/json' });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'data_from_api.json';

                document.body.appendChild(link);
                link.click();

                document.body.removeChild(link);
            })
            .catch(error => {
                console.error("Error fetching data from API:", error);
            });
    }

    function displayData() {
        const selectedFields = Array.from(displayFields.options).map(option => option.value);
        const sortField = selectedFields[0];
        const sortedData = rawData.slice().sort((a, b) => {
            const valueA = a[sortField];
            const valueB = b[sortField];
            return typeof valueA === 'number' ? valueB - valueA : valueB.localeCompare(valueA);
        });

        const tableHeader = `<tr>${selectedFields.map(field => `<th>${field}</th>`).join("")}</tr>`;
        const tableRows = sortedData.map(item => {
            const row = selectedFields.map(field => `<td>${item[field]}</td>`).join("");
            return `<tr>${row}</tr>`;
        }).join("");
        const displayPage = `<html>
                                <head>
                                    <title>Display Product</title>
                                    <link rel="stylesheet" href="abc.css">
                                    <style>
                                    table {
                                        border-collapse: collapse;
                                        width: 100%;
                                    }

                                    th, td {
                                        border: 1px solid #ddd;
                                        padding: 8px;
                                        text-align: left;
                                    }

                                    th {
                                        font-weight: bold;
                                    }
                                    </style>
                                </head>
                                <body>
                                    <h1>Product Details Display Table [First Column Selected Based Descending order]</h1>
                                    <div id="displayTable">
                                        <table>
                                            <thead>${tableHeader}</thead>
                                            <tbody>${tableRows}</tbody>
                                        </table>
                                    </div>
                                </body>
                              </html>`;

        const blob = new Blob([displayPage], { type: 'text/html' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
