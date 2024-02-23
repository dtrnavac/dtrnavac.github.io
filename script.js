let chart = document.getElementById('myChart');

$(document).ready(function () {
    if ($('#myChart').html() === "") {
        $.get('merenje.CSV', function (data) { dataToArrays(data) }, 'text');
    }

    document.getElementById('csvFile').addEventListener('change', upload, false);
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
        if (element.title === 'Komentar') {
            return true;
        }
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

        // Exclude the "Comment" data from the dataset
        if (commentIndex !== -1) {
            dataMatrix[i].splice(commentIndex, 1);
        }

        let datasetData = dataMatrix[i];
        datasetData.splice(0, 3);

        datasets.push({
            label: label,
            data: datasetData,

            borderColor: '#' + getColor(),
            borderWidth: '1',

            pointRadius: 0,
        });
    }

    /* /Data */

    let myChart = document.getElementById('myChart').getContext('2d');
    let type = 'line';
    let data = {
        labels,
        datasets,
    };
    let options = {
        title: {
            display: true,
            text: ['Prikaz merenja'],
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
                title: (toolTipItem) => {
                    return headingArray[0].title + ": " + toolTipItem[0].label + " " + headingArray[0].unit;
                },
                label: (toolTipItem) => {
                    return toolTipItem.yLabel + " " + headingArray[toolTipItem.datasetIndex + 1].unit;

                },
            },
        },
    };

    chart = new Chart(myChart, { type, data, options });
}

function getColor() {
    colors = [
        'FF0000',
        'FF4500',
        'C71585',
        'FF8C00',
        'FF00FF',
        '1E90FF',
        '0000FF',
        'D2691E',
        'CD5C5C',
        '6A5ACD',
        '32CD32',
        '008080',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
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
