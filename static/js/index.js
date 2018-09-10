'use strict'

function plot_monthly_bal(data) {
    var filtered_data = data.map(function(element) {
        var dollar_amount = element["amounts"].filter(function(amount) {
            return amount["currency"] == "$";
        });

        if (dollar_amount.length > 0) {
            return {'amount': dollar_amount[0]['amount'],
                    'label': element['account']};
        } else {
            return none;
        }
    });

    var ctx = document.getElementById('monthly-bal').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [{
                data: filtered_data.map(function(element) {return element['amount'];})
            }],
            labels: filtered_data.map(function(element) {return element['label'];})
        },
        options: {}
    });
}

$(document).ready(function() {
    $.ajax({
        url: "/monthly-bal",
        method: 'GET'

    }).done(function(data){
        var current_month_exp = JSON.parse(data);
        plot_monthly_bal(current_month_exp);
    });
})
