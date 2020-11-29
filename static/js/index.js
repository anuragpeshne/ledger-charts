'use strict';

const DELIM = '/';
const PRIM_CURRENCY = '$';

var pieChart = null;
var lineChart = null;
var goodColors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f',
		              '#00a950', '#58595b', '#8549ba',
                  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4',
                  '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
                  '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1',
                  '#000075', '#808080', '#ffffff', '#000000'];

function collapseAccounts(data, depth) {
  var collapsedData = {};
  for (var i = 0; i < data.length; i++) {
    var accounts = data[i].account.split(':');
    var key = accounts.slice(0, depth).join(':');
    if (!(key in collapsedData)) {
      collapsedData[key] = [];
    }
    collapsedData[key] = addAmountList(collapsedData[key], data[i].amount);
  }
  var collapsedList = [];
  for (var key in collapsedData) {
    collapsedList.push({
      "amount": collapsedData[key],
      "account": key
    });
  }
  return collapsedList;
}

function plotPie(data, depth) {
  var traversal = collapseAccounts(data, depth);
  var labels = traversal.map(function(element) { return element['account']; });
  var dataPoints = traversal
      .map(function(element) { return element['amount']; })
      .map(function(amount) { return convert2primarycurrency(amount); });

  var pieCanvas = document.getElementById('pie-canvas');
  var ctx = pieCanvas.getContext('2d');
  if (pieChart != null) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      datasets: [{
        data: dataPoints.map((v) => { return Math.abs(v); }),
        backgroundColor: goodColors.slice(0, dataPoints.length)
      }],
      labels: labels
    },
    options: {
      onClick: function(event) {
        var clickedPoint = pieChart.getElementsAtEvent(event)[0];

        if (clickedPoint) {
          var label = pieChart.data.labels[clickedPoint._index];
          var value = pieChart.data.datasets[clickedPoint._datasetIndex].data[clickedPoint._index];
          var account = label; // replace all '/' with ':'
          var newCommand = $('#pie-command').val().trim() + ' ' + account;
          $('#pie-command').val(newCommand);
          refreshPie();
        }
      }
    }
  });
}

function convert2primarycurrency(amount) {
  var value = 0.0;
  for (var i = 0; i < amount.length; i++) {
    var item = amount[i];
    if (item.commodity == "$") {
      value += item.amount;
    } else if (item.commodity == "INR") {
      value += item.amount / 70; // todo
    } else {
      console.log("ignoring " + item.commodity + " " + item.amount);
    }
  }
  var rounded = Math.round(value * 100) / 100;
  return rounded;
}

function addAccountField(event) {
  var addAccountBtn = $(event.target);
  var field = $("<div class=\"input-line\">" +
                "<label class=\"command\">account:</label>" +
                "<input type=\"text\" class=\"form-control command account-input input-command line-input\"/>" +
                "</span>" +
                "<button type=\"button\" class=\"close delete-account-btn\" aria-label=\"Close\">" +
                "<span aria-hidden=\"true\">&times;</span>" +
                "</button>" +
               "</div>");
  field.children().last().click(deleteAccountField);
  field.insertBefore(addAccountBtn);
}

function deleteAccountField(event) {
  event.target.parentElement.parentElement.remove();
}

function groupByDate(data) {
  var dateMap = {};

}

function plotLine(dataSet, accountNames, sumType) {
  console.log(dataSet);
  var timestepSet =
      dataSet[0]
      .map((entry) => { return entry.date; })
      .reduce((set, date) => { set[date] = true; return set; }, {});
  var timesteps = Object.keys(timestepSet);

  var lineCanvas = document.getElementById('line-canvas');
  var ctx = lineCanvas.getContext('2d');
  if (lineChart != null) lineChart.destroy();
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      'labels': timesteps,
      'datasets': []
    }
  });

  for (var i = 0; i < dataSet.length; i++) {
    var data = dataSet[i];
    var amountDateSet =
        data
        .reduce(
          (set, entry) => {
            if (!(entry.date in set)) {
              set[entry.date] = [];
            }
            set[entry.date] = addAmountList(set[entry.date], entry[sumType]);
            return set;
          },
          {});
    var amountValues =
        Object.values(amountDateSet)
        .map((amount) => { return convert2primarycurrency(amount); });
    lineChart.data.datasets.push({
      label: accountNames[i],
      data: amountValues.map((v) => { return Math.abs(v); }),
      borderColor: goodColors[i],
      backgroundColor: 'rgba(0, 0, 0, 0)'
    });
  }
  lineChart.update();
}


function addAmountList(amountA, amountB) {
  var resultAmount = copyObjList(amountA);
  for (const [key, itemB] of Object.entries(amountB)) {
    var found = false;
    for (const [key, itemResult] of Object.entries(resultAmount)) {
      if (itemB.commodity === itemResult.commodity) {
        found = true;
        itemResult.amount += itemB.amount;
      }
    }
    if (found === false) {
      resultAmount.push(itemB);
    }
  }
  return resultAmount;
}

function copyObjList(input) {
  var result = [];
  for (var i = 0; i < input.length; i++) {
    result.push({...input[i]});
  }
  return result;
}
