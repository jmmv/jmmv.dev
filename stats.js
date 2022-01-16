// jmmv.dev
// Copyright 2022 Julio Merino

// WARNING: This file requires script.js to be loaded first.

// Colors used to draw chart lines.  Should match whatever is defined in main.scss.
LINE_COLOR_1 = 'black';
LINE_COLOR_2 = 'rgb(0, 60, 100)';
LINE_COLOR_3 = 'rgb(0, 120, 180)';

// Time window to request from the server.
TIME_WINDOW_START = null;
TIME_WINDOW_END = null;

// Total number of entries to request in the top N queries.
TOP_N_LIMIT = 10;

// Chart to draw the daily page views and visitor counts on.
DAILY_ACTIVITY_CHART = null;

// Identifier of the table that holds the top viewed pages data.
TOP_VIEWED_PAGES_TABLE = null;

// Identifier of the table that holds the top referrers data.
TOP_REFERRERS_TABLE = null;

// Identifier of the table that holds the top countries data.
TOP_COUNTRIES_TABLE = null;

function makeStatsURL() {
    return new URL(API_BASE_URL + "/sites/" + SITE_ID + "/stats");
}

function truncateToDay(date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function toUtcTimestamp(date) {
    return Math.floor((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / 1000);
}

function setTimeWindow(days) {
    let end = new Date();
    if (days > 0) {
        // Avoid showing today's data when displaying past data because today's data are still
        // changing and distorts the metrics.
        end = new Date(truncateToDay(end).getTime() - 1);
    }
    TIME_WINDOW_START = truncateToDay(new Date(end.getTime() - days * 24 * 60 * 60 * 1000));
    TIME_WINDOW_END = end;

    refreshStats();
}

function fillTopNTable(table, data) {
    table.children('tbody').empty();
    data.forEach(function(item) {
        let tdLink = $('<td></td>');
        tdLink.text(item[0]);
        let tdCount = $('<td class="text-right"></td>');
        tdCount.text(item[1]);
        let tr = $('<tr></tr>');
        tr.append(tdLink);
        tr.append(tdCount);
        table.children('tbody:last-child').append(tr);
    });
}

function refreshStats() {
    let url = makeStatsURL();
    url.searchParams.append('time_window_start', toUtcTimestamp(TIME_WINDOW_START));
    url.searchParams.append('time_window_end', toUtcTimestamp(TIME_WINDOW_END));
    url.searchParams.append('top_n_limit', TOP_N_LIMIT);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        if (this.status != 200) {
            console.log("Error fetching stats: " + this.responseText);
            return;
        }

        var response = JSON.parse(this.responseText);

        DAILY_ACTIVITY_CHART.data.datasets[0].data = response.daily_page_views;
        DAILY_ACTIVITY_CHART.data.datasets[1].data = response.daily_visitors;
        DAILY_ACTIVITY_CHART.data.datasets[2].data = response.daily_returning_visitors;
        DAILY_ACTIVITY_CHART.update();

        fillTopNTable(TOP_VIEWED_PAGES_TABLE, response.top_pages_by_views);
        fillTopNTable(TOP_REFERRERS_TABLE, response.top_referrers_by_views);
        fillTopNTable(TOP_COUNTRIES_TABLE, response.top_countries_by_views);
    }
    xmlHttp.open("GET", url.href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}

function setupStats(
    dailyActivityCanvasId, topViewedPagesTableId, topReferrersTableId, topCountriesTableId) {
    var ctx = document.getElementById(dailyActivityCanvasId).getContext('2d');
    DAILY_ACTIVITY_CHART = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Page views',
                data: [],
                backgroundColor: LINE_COLOR_1,
                borderColor: LINE_COLOR_1,
            }, {
                label: 'Visitors',
                data: [],
                backgroundColor: LINE_COLOR_2,
                borderColor: LINE_COLOR_2,
            }, {
                label: 'Returning visitors',
                data: [],
                backgroundColor: LINE_COLOR_3,
                borderColor: LINE_COLOR_3,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Daily activity',
                },
                legend: {
                    display: true,
                    position: 'right',
                },
            },
        },
    });

    TOP_VIEWED_PAGES_TABLE = $('#' + topViewedPagesTableId);
    TOP_REFERRERS_TABLE = $('#' + topReferrersTableId);
    TOP_COUNTRIES_TABLE = $('#' + topCountriesTableId);

    setTimeWindow(30);
}
