'use strict'

const DELIM = '/';
const PRIM_CURRENCY = '$';

var pieChart = null;

var goodColors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f',
		              '#00a950', '#58595b', '#8549ba',
                  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4',
                  '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
                  '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1',
                  '#000075', '#808080', '#ffffff', '#000000'];

// takes in {amounts, accounts, children:[]} gives back {amounts, account}
function flattenList(data, depth) {
    function flattenListPrivate(data, depth, currentDepth, prefix) {
        return data.reduce(function(accFlattenedObj, childObj) {
            if (childObj.children.length == 0 || currentDepth == depth) {
                accFlattenedObj.push({
                    'amounts': childObj['amounts'],
                    'account': prefix + DELIM + childObj['account']
                });
            } else {
                accFlattenedObj = accFlattenedObj.concat(
                        flattenListPrivate(
                            childObj.children,
                            depth,
                            currentDepth + 1,
                            prefix + DELIM + childObj['account']));
            }
            return accFlattenedObj;
        }, []);
    }
    return flattenListPrivate(data, depth, 1, '');
}

function uniformAmount(data) {
    return data.map(function(element) {
        var primaryCurrencyAmount = element["amounts"].reduce(function(acc, amountObj) {
            if (amountObj["currency"] == PRIM_CURRENCY) {
                return acc + amountObj['amount'];
            } else {
                return acc;
            }
        }, 0);

        var otherCurrencyAmount = element["amounts"].reduce(function(acc, amountObj){
            if (amountObj["currency"] != PRIM_CURRENCY) {
                return acc + convertCurrency(amountObj["amount"],
                                              amountObj["currency"],
                                              PRIM_CURRENCY);
            } else {
                return acc;
            }
        }, 0);

        return {
            'amount': primaryCurrencyAmount + otherCurrencyAmount,
            'label': element["account"]
        };
    });
}

function convertCurrency(amount, sourceCurrency, targetCurrency) {
    // TODO: have better logic
    if (sourceCurrency == 'INR' && targetCurrency == '$') {
        return amount / 70;
    } else {
        throw "Unimplemented";
    }
}

function plotPie(data, depth) {
    var flattenedList = flattenList(data, depth);
    var filteredData = uniformAmount(flattenedList);
    var pieCanvas = document.getElementById('pie-canvas');
    var ctx = pieCanvas.getContext('2d');
    if (pieChart != null) {
        pieChart.destroy();
    }
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [{
                data: filteredData.map(function(element) {return element['amount'];}),
                backgroundColor: goodColors.slice(0, filteredData.length)
            }],
            labels: filteredData.map(function(element) {return element['label'];})
        },
        options: {
            onClick: function(event) {
                var clickedPoint = pieChart.getElementsAtEvent(event)[0];

                if (clickedPoint) {
                    var label = pieChart.data.labels[clickedPoint._index];
                    var value = pieChart.data.datasets[clickedPoint._datasetIndex].data[clickedPoint._index];
                    var account = label.substring(1).replace('/',':');
                    var newCommand = $('#pie-command').val().trim() + ' ' + account;
                    $('#pie-command').val(newCommand);
                    refreshPie();
                }
            }
        }
    });
}

function refreshPie() {
    var pieCommand = $('#pie-command').val();
    $.ajax({
        url: "/balance",
        method: 'GET',
        data: { param: pieCommand }
    }).done(function(data){
        var jsonData = JSON.parse(data);
        var depth = parseInt($('#pie-depth').val());
        plotPie(jsonData, depth);
    });
}

$(document).ready(function() {
    (function plotMonthlyBal() {
        var today = new Date();
        // ISO format
        var monthFirst = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + '01';
        $('#pie-command').val('-b ' + monthFirst);
        refreshPie();
    })();

    $('.pie-input').change(function(event){ refreshPie(); });
});
