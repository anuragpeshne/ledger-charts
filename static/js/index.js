'use strict'

const DELIM = '/';
const PRIM_CURRENCY = '$';

var pie_chart = null;

var goodColors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f',
		              '#00a950', '#58595b', '#8549ba',
                  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4',
                  '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
                  '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1',
                  '#000075', '#808080', '#ffffff', '#000000'];

// takes in {amounts, accounts, children:[]} gives back {amounts, account}
function flatten_list(data, depth) {
    function flatten_list_private(data, depth, current_depth, prefix) {
        return data.reduce(function(acc_flattened_obj, child_obj) {
            if (child_obj.children.length == 0 || current_depth == depth) {
                acc_flattened_obj.push({
                    'amounts': child_obj['amounts'],
                    'account': prefix + DELIM + child_obj['account']
                });
            } else {
                acc_flattened_obj = acc_flattened_obj.concat(
                        flatten_list_private(
                            child_obj.children,
                            depth,
                            current_depth + 1,
                            prefix + DELIM + child_obj['account']));
            }
            return acc_flattened_obj;
        }, []);
    }
    return flatten_list_private(data, depth, 1, '');
}

function uniform_amount(data) {
    return data.map(function(element) {
        var primary_currency_amount = element["amounts"].reduce(function(acc, amount_obj) {
            if (amount_obj["currency"] == PRIM_CURRENCY) {
                return acc + amount_obj['amount'];
            } else {
                return acc;
            }
        }, 0);

        var other_currency_amount = element["amounts"].reduce(function(acc, amount_obj){
            if (amount_obj["currency"] != PRIM_CURRENCY) {
                return acc + convert_currency(amount_obj["amount"],
                                              amount_obj["currency"],
                                              PRIM_CURRENCY);
            } else {
                return acc;
            }
        }, 0);

        return {
            'amount': primary_currency_amount + other_currency_amount,
            'label': element["account"]
        };
    });
}

function convert_currency(amount, source_currency, target_currency) {
    // TODO: have better logic
    if (source_currency == 'INR' && target_currency == '$') {
        return amount / 70;
    } else {
        throw "Unimplemented";
    }
}

function plot_monthly_bal(data, depth) {
    var flattened_list = flatten_list(data, depth);
    var filtered_data = uniform_amount(flattened_list);
    var pieCanvas = document.getElementById('monthly-bal');
    var ctx = pieCanvas.getContext('2d');
    if (pie_chart != null) {
        pie_chart.destroy();
    }
    pie_chart = new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [{
                data: filtered_data.map(function(element) {return element['amount'];}),
                backgroundColor: goodColors.slice(0, filtered_data.length)
            }],
            labels: filtered_data.map(function(element) {return element['label'];})
        },
        options: {}
    });
}

$(document).ready(function() {
    function get_and_plot_month_bal() {
        $.ajax({
            url: "/monthly-bal",
            method: 'GET'

        }).done(function(data){
            var current_month_exp = JSON.parse(data);
            var depth = parseInt($('#monthly-bal-depth').val());
            plot_monthly_bal(current_month_exp, depth);
        });
    }

    $('#monthly-bal-depth').change(function(event){ get_and_plot_month_bal(); });
    get_and_plot_month_bal();
});
