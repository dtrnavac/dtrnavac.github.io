$(document).ready(function () {
    if ($('#myChart').html() === "") {
        $.get('merenje.csv', function (data) { dataToArrays(data) }, 'text');
    }

    document.getElementById('csvFile').addEventListener('change', upload, false);

    var vratiNaVrhBtn = document.getElementById("vratiNaVrhBtn");

    window.addEventListener("scroll", function () {
        if (window.pageYOffset > 100) {
            vratiNaVrhBtn.style.display = "block";
        } else {
            vratiNaVrhBtn.style.display = "none";
        }
    });

    vratiNaVrhBtn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

function dataToArrays(data) {
    let rawData = Papa.parse(data);

    createChart(rawData);
}

function createChart(parsedData) {
    let dataArray = parsedData.data;
    let dataMatrix = [];

    let headingArray = [];

    for (let i = 0; i < dataArray[0].length; i++) {
        dataMatrix[i] = [];

        headingArray.push({
            title: dataArray[0][i],
            unit: dataArray[1][i],
        })
    }

    for (let i = 0; i < dataArray.length; i++) {
        for (let j = 0; j < dataArray[i].length; j++) {
            if (!dataArray[i][j]) {
                dataArray[i][j] = null;
            }
            dataMatrix[j][i] = dataArray[i][j];
        }
    }

    let commentIndex = headingArray.findIndex(element => {
        return element.title.toLowerCase() === 'komentar';
    });

    if (commentIndex !== -1) {
        dataMatrix.splice(commentIndex, 1);
        headingArray.splice(commentIndex, 1);
    }

    let html = '';
    html += '<table class="table"><tbody>';

    parsedData.data.forEach(element => {
        if (element.some(function (el) { return el !== null; })) {
            html += '<tr>';
            element.forEach(element => {
                html += '<td>' + (element !== null ? element : '') + '</td>';
            });
            html += '</tr>';
        }
    });
    html += '</tbody></table>'
    $('#parsedData').html(html);

    console.log(parsedData);
    console.log(dataMatrix);
    console.log(headingArray);

    /* Global chart options */

    Chart.defaults.global.defaultFontFamily = 'Consolas';
    Chart.defaults.global.defaultFontSize = 18;
    Chart.defaults.global.defaultFontColor = 'black';

    Chart.defaults.global.elements.line.backgroundColor = 'transparent';

    /* /Global chart options */

    /* Data */

    let labels = dataMatrix[0];
    labels.splice(0, 3);

    let datasets = [];

    for (let i = 1; i < dataMatrix.length; i++) {
        let label = dataMatrix[i][0];

        // Exclude the "Komentar" data from the dataset
        if (commentIndex !== -1) {
            dataMatrix[i].splice(commentIndex, 1);
        }

        let datasetData = dataMatrix[i];
        datasetData.splice(0, 3);

        const color = getColor();
        console.log('Boja za dataset ' + label + ':', color);

        datasets.push({
            label: label,
            data: datasetData,

            borderColor: '#' + color,
            borderWidth: '1',

            pointRadius: 0,
        });
    }

    /* /Data */

    let myChart = document.getElementById('myChart').getContext('2d');
    let type = 'line';
    let data = {
        labels: labels.map(label => formatirajVreme(label)),
        datasets,
    };
    let options = {
        title: {
            display: true,
            text: ['Prikaz rezultata merenja'],
            fontSize: 23,
        },
        legend: {
            position: 'bottom',
            labels: {
                fontColor: 'black',
            }
        },
        tooltips: {
            intersect: false,
            callbacks: {
                title: (tooltipItem, data) => {
                    let label = tooltipItem[0].xLabel;
                    return 'Vreme: ' + label + ' m/s';
                },
                label: (tooltipItem, data) => {
                    let datasetLabel = data.datasets[tooltipItem.datasetIndex].label || '';
                    return datasetLabel + ': ' + tooltipItem.yLabel + ' ' + headingArray[tooltipItem.datasetIndex + 1].unit;
                }
            }
        }
    };

    chart = new Chart(myChart, { type, data, options });
}

function formatirajVreme(vreme) {
    var minuti = Math.floor(vreme / 60);
    var sekunde = vreme % 60;

    sekunde = Math.round(sekunde / 5) * 5;

    if (sekunde === 60) {
        minuti++;
        sekunde = 0;
    }

    return minuti.toString().padStart(2, '0') + ':' + sekunde.toString().padStart(2, '0');
}

let colorIndex = 0;

function getColor() {
    const colors = [
        'FF5733', 'FFA533', '77FF33', 'CCCC00', '3366FF', 'FF33FF', '33FFFF', 'FF9933', '66FF33',
    ];

    const color = colors[colorIndex];

    colorIndex = (colorIndex + 1) % colors.length;

    return color;
}

function upload(evt) {
    if (chart != null) {
        chart.destroy();
    }

    let data = null;
    let file = evt.target.files[0];
    let reader = new FileReader();
    try { reader.readAsText(file); } catch (e) { console.log(e) }
    reader.onload = function (event) {
        let csvData = event.target.result;
        data = csvData;
        if (data && data.length > 0) {
            console.log('Imported -' + data.length + '- rows successfully!');
            dataToArrays(data);
        } else {
            console.log('No data to import!');
        }
    };
    reader.onerror = function () {
        console.log('Unable to read ' + file.fileName);
    };
}

function downloadDataAsExcel() {
    let csvContent = "data:text/csv;charset=utf-8,";
    let table = document.getElementById('parsedData');
    let rows = table.querySelectorAll('tr');

    rows.forEach(function (row) {
        let rowData = [];
        let cols = row.querySelectorAll('td');
        cols.forEach(function (col) {
            rowData.push(col.textContent);
        });
        let rowCSV = rowData.join(",");
        csvContent += rowCSV + "\r\n";
    });

    // Create a Blob containing the CSV data
    let blob = new Blob([csvContent], { type: 'data:text/csv;charset=utf-8;' });

    // Create a link element and trigger the download
    let link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
}

// Attach the function to the button click event
document.getElementById('downloadBtn').addEventListener('click', downloadDataAsExcel);
