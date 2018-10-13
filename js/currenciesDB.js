var read = new XMLHttpRequest();
read.open('GET', 'coins_list.txt', false);
read.send();

var allCurrenciesRaw = read.responseText;
var allCurrenciesArr = allCurrenciesRaw.split('\n');
var allCurrenciesHtmlFirstColumn = '';
var allCurrenciesHtmlSecondColumn = '';

var currenciesPrice = {};
$.ajax({
    url: 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,LTC,USDT&tsyms=USD',
    async: false,
    success: function (data) {
        for (const key in data) {
            currenciesPrice[key] = data[key]['USD'];
        }
    },
});

allCurrenciesArr.map(item => {
    var coinTitle = item.split('-')[0].trim();
    var coinShort = item.split('-')[1].trim();
    var coinLowerCaseShort = item.split('-')[1].trim().toLowerCase();

    allCurrenciesHtmlFirstColumn +=
        '<div class="exch-dropdown__item" data-name="' + coinTitle + '" data-telegram="' + coinShort + ' ' + coinTitle + ' Room" data-currency="' + coinShort + '">' +
        '<svg class="exch-dropdown__icon clr-coin-' + coinLowerCaseShort + '" role="img" aria-hidden="true">' +
        '<use xmlns: xlink="http://www.w3.org/1999/xlink" xlink:href="img/sprite-inline.svg#coin-' + coinLowerCaseShort + '"></use>' +
        '</svg> <p class="exch-dropdown__title"><b>' + coinShort + '</b> - ' + coinTitle + '</p>' +
        '</div >';

    allCurrenciesHtmlSecondColumn +=
        '<div class="exch-dropdown__item" data-name="' + coinTitle + '" data-currency="' + coinShort + '">' +
        '<svg class="exch-dropdown__icon clr-coin-' + coinLowerCaseShort + '" role="img" aria-hidden="true">' +
        '<use xmlns: xlink="http://www.w3.org/1999/xlink" xlink:href="img/sprite-inline.svg#coin-' + coinLowerCaseShort + '"></use>' +
        '</svg> <p class="exch-dropdown__title"><b>' + coinShort + '</b> - ' + coinTitle + '</p>' +
        '</div >';

});

$('.exch-dropdown__scroll').eq(0).append(allCurrenciesHtmlFirstColumn);
$('.exch-dropdown__scroll').eq(1).append(allCurrenciesHtmlSecondColumn);

const numberWithCommas = (x) => {
    if (x)
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var currentWallet;
var ownWallet;

var wallets = {
    ownWallet: {
        'USDT': 100000.00,
        'BTC': 0.00,
        'ETH': 0.00,
        'LTC': 0.00,
    }
}

var eachBalance = {};
var eachPercent = {};
var totalBalance;

ownWallet = wallets['ownWallet'];
currentWallet = wallets['ownWallet'];
updateWalletData(true);

function updateWalletData(redrawSmallCharts) {
    totalBalance = 0;
    for (const key in currentWallet) {
        eachBalance[key] = currentWallet[key] * currenciesPrice[key];
        eachBalance[key] = +eachBalance[key].toFixed(2);
        totalBalance += eachBalance[key];

        if (!$('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').length) {
            var currencyName = $('.exch-dropdown__item[data-currency="' + key + '"]').eq(0).attr('data-name');
            var newRow = '<div class="basic-table__row disabled" data-currency="' + key + '">' +
                '<div class="basic-table__col w-37">' +
                '<svg class="basic-table__curr icon-curr clr-coin-ltc" role="img" aria-hidden="true">' +
                '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="img/sprite-inline.svg#coin-' + key.toLowerCase() + '"></use>' +
                '</svg>' +
                '<div class="d-flex-col">' +
                '<span class="bigger"><span class="bold wallet' + key + '"></span> ' + key + ' </span><span class="smaller">' + currencyName + '</span>' +
                '</div></div>' +
                '<div class="basic-table__col w-40">' +
                '<div class="smallCurrencyChart" id="smallChart' + key + '"></div>' +
                '<div class="bigger smallChartInfo d-flex-col"></div></div>' +
                '<div class="basic-table__col w-22"><button class="basic-table__btn d-flex-col fix-width" transaction-fancybox><span class="bigger">DEPOSIT</span>' + key + '</button></div>' +
                '</div>';
            $('#panel-funds-wallet .basic-table .basic-table').append(newRow);
        }

        if (currentWallet[key].toFixed(2) != 0) {
            if ($('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').hasClass('disabled')) {
                $('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').removeClass('disabled');
                $('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').detach().insertBefore('#panel-funds-wallet .basic-table .basic-table .basic-table__row:first');
            }
        }
        if (currentWallet[key].toFixed(2) == 0) {
            if (!$('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').hasClass('disabled')) {
                $('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').addClass('disabled');
                $('#panel-funds-wallet .basic-table__row[data-currency="' + key + '"]').detach().insertBefore('#panel-funds-wallet .basic-table .basic-table .basic-table__row.disabled:first');
            }
        }

        $('.pricePerCoin' + key).html('$' + numberWithCommas(currenciesPrice[key]));
        $('.wallet' + key).html(numberWithCommas(currentWallet[key].toFixed(2)));
    }
    totalBalance = totalBalance.toFixed(2);

    for (const key in eachBalance) {
        eachPercent[key] = eachBalance[key] / totalBalance;
        eachPercent[key] = eachPercent[key].toFixed(2) * 100; // percent view
    }

    var totalBalanceTrunc = Math.trunc(totalBalance);
    var totalBalanceFraction = (totalBalance - Math.trunc(totalBalance)).toFixed(2).substr(1);


    $('.totalBalanceTrunc').html(numberWithCommas(totalBalanceTrunc));
    $('.totalBalanceFraction').html(totalBalanceFraction);

    $('.clearPricePerCoinBTC').html(numberWithCommas(currenciesPrice['BTC']));

    if (redrawSmallCharts) updateSmallCharts();

}

function updateSmallCharts() {
    var chartRange = $('.graph-range-slider__current').text();
    var ajaxUrl = '';

    for (const key in currentWallet) {
        switch (chartRange) {
            case '1H':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histominute?fsym=' + key + '&tsym=USD&limit=60';
                break;
            case '2H':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histominute?fsym=' + key + '&tsym=USD&limit=120';
                break;
            case '6H':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histominute?fsym=' + key + '&tsym=USD&limit=360';
                break;
            case '1D':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histominute?fsym=' + key + '&tsym=USD&aggregate=10&limit=144';
                break;
            case '1W':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histohour?fsym=' + key + '&tsym=USD&limit=168';
                break;
            case '1M':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histohour?fsym=' + key + '&tsym=USD&aggregate=5&limit=149';
                break;
            case '1Y':
                ajaxUrl = 'https://min-api.cryptocompare.com/data/histoday?fsym=' + key + '&tsym=USD&aggregate=3&limit=122';
                break;
            default:
                break;
        }
        // draw small Chart 
        $.ajax({
            url: ajaxUrl,
            success: function (data) {
                var graphArr = data.Data.map(s => (s.open + s.close) / 2);
                if (!graphArr.length) {
                    for (let i = 0; i < 25; i++) {
                        graphArr.push(1);
                    };
                };
                var min = Math.min(...graphArr);
                var max = Math.max(...graphArr);
                var changeInPercent = (-1 + (graphArr[graphArr.length - 1] / graphArr[0])) * 100;
                var smallChartInfoString;
                var lineColor;

                // blue color
                if (changeInPercent > 0) {
                    smallChartInfoString = '<div class="clr-green">$' + currenciesPrice[key].toFixed(2) + '<br><span class="smaller">+' + Math.abs(changeInPercent.toFixed(2)) + '%</span></div>';
                    lineColor = '#01B067';
                    gradientColor = {
                        linearGradient: [0, 0, 0, 30],
                        stops: [
                            [0, Highcharts.Color('#01B067').setOpacity(0.2).get('rgba')],
                            [1, Highcharts.Color('#01B067').setOpacity(0).get('rgba')]
                        ]
                    };
                }
                // red color
                else {
                    smallChartInfoString = '<div class="clr-darkRed">$' + currenciesPrice[key].toFixed(2) + '<br><span class="smaller">-' + Math.abs(changeInPercent.toFixed(2)) + '%</span></div>';
                    lineColor = '#CE2424';
                }

                if (currentWallet[key].toFixed(2) == 0) {
                    lineColor = '#C5C5C5';
                }

                var cloneOptions = Object.assign({}, smallCurrencyChartOptions);
                cloneOptions.series[0].data = graphArr;
                cloneOptions.series[0].color = lineColor;
                cloneOptions.yAxis.min = min;
                cloneOptions.yAxis.max = max;
                if ($('#smallChart' + key).length)
                    Highcharts.chart('smallChart' + key, cloneOptions);
                $('#smallChart' + key).parent().find('.smallChartInfo').html(smallChartInfoString);
            },
        });
    }
}

    function updateRecent() {
        for (const key in currentWallet) {
            if (currentWallet[key].toFixed(2) != 0) {
                // add to recent
                if ($('.exch-head__send .exch-dropdown__list .exch-dropdown__item[data-currency="' + key + '"]').length == 1) {
                    var newElem = $('.exch-head__send .exch-dropdown__list .exch-dropdown__item[data-currency="' + key + '"]').eq(0).clone();
                    $(newElem).insertBefore('.exch-head__send .exch-dropdown__list .exch-dropdown__list-title:last');
                }
            }
            if (currentWallet[key].toFixed(2) == 0) {
                // remove from recent
                if ($('.exch-head__send .exch-dropdown__list .exch-dropdown__item[data-currency="' + key + '"]').length == 2) {
                    $('.exch-head__send .exch-dropdown__list .exch-dropdown__item[data-currency="' + key + '"]').eq(0).remove();
                }
            }
        }
    }