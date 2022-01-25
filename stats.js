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

// Chart to draw the realtime visitor counts on.
REAL_TIME_ACTIVITY_CHART = null;

// Counter of active visitors.
REAL_TIME_ACTIVE_COUNT = null;

// Identifier of the table that holds the active pages.
REAL_TIME_PAGES_TABLE = null;

// Identifier of the table that holds the active referrers.
REAL_TIME_REFERRERS_TABLE = null;

// Chart to draw the daily page views and visitor counts on.
DAILY_ACTIVITY_CHART = null;

// Identifier of the table that holds the top viewed pages data.
TOP_VIEWED_PAGES_TABLE = null;

// Identifier of the table that holds the top voted pages data.
TOP_VOTED_PAGES_TABLE = null;

// Identifier of the table that holds the top referrers data.
TOP_REFERRERS_TABLE = null;

// Identifier of the table that holds the top countries data.
TOP_COUNTRIES_TABLE = null;

// Hook to display the stats when they are fully loaded.
SHOW_STATS = null;

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
    let end = luxon.DateTime.now().toUTC();
    // Avoid showing today's data when displaying past data because today's data are still
    // changing and distort the metrics.
    end = luxon.DateTime.utc(end.year, end.month, end.day);
    TIME_WINDOW_START = end.plus({ days: -days, milliseconds: 1 });
    TIME_WINDOW_END = end;

    refreshStats();
}

function fillTopNTable(table, data) {
    table.children('tbody').empty();
    data.forEach(function(item) {
        let tr = $('<tr></tr>');
        for (let i = 0; i < item.length; i++) {
            var td;
            if (i == 0) {
                td = $('<td></td>');

                if (item[i].startsWith('http://') || item[i].startsWith('https://')) {
                    var a = $('<a></a>');
                    a.attr('href', item[i]);
                    a.text(item[i]);
                    td.append(a);
                } else {
                    td.text(item[i]);
                }
            } else {
                td = $('<td class="text-right"></td>');
                td.text(item[i]);
            }
            tr.append(td);
        }
        table.children('tbody:last-child').append(tr);
    });
}

function flattenTopNVotes(data) {
    var output = [];
    data.forEach(function(item) {
        output.push([item[0], "+" + item[1].ThumbsUp, "-" + item[1].ThumbsDown]);
    });
    return output;
}

function refreshStats() {
    let url = makeStatsURL();
    url.searchParams.append(
        'window',
        ~~TIME_WINDOW_START.toSeconds() + "-" + ~~TIME_WINDOW_END.toSeconds());
    url.searchParams.append(
        'extra_window',
        ~~TIME_WINDOW_START.minus({ days: 7 }).toSeconds() + "-" + ~~TIME_WINDOW_END.toSeconds());
    url.searchParams.append('top_n_limit', TOP_N_LIMIT);
    url.searchParams.append('get_page_views', true);
    url.searchParams.append('get_visitors', true);
    url.searchParams.append('get_returning_visitors', true);
    url.searchParams.append('get_top_pages_by_views', true);
    url.searchParams.append('get_top_pages_by_votes', true);
    url.searchParams.append('get_top_referrers_by_views', true);
    url.searchParams.append('get_top_countries_by_views', true);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        if (this.status != 200) {
            SHOW_STATS("Error fetching stats: " + this.responseText);
            return;
        }

        var response = JSON.parse(this.responseText);

        var max = 0;
        for (var i = 0; i < response.page_views.length; i++) {
            if (response.page_views[i][1] > max) {
                max = response.page_views[i][1];
            }
        }
        max = ~~(~~((max + 100) / 100) * 100);

        DAILY_ACTIVITY_CHART.data.datasets[0].data = response.page_views;
        DAILY_ACTIVITY_CHART.data.datasets[1].data = response.visitors;
        DAILY_ACTIVITY_CHART.data.datasets[2].data = response.returning_visitors;
        DAILY_ACTIVITY_CHART.options.scales.y.max = max;
        DAILY_ACTIVITY_CHART.update();

        fillTopNTable(TOP_VIEWED_PAGES_TABLE, response.top_pages_by_views);
        fillTopNTable(TOP_VOTED_PAGES_TABLE, flattenTopNVotes(response.top_pages_by_votes));
        fillTopNTable(TOP_REFERRERS_TABLE, response.top_referrers_by_views);
        fillTopNTable(TOP_COUNTRIES_TABLE, response.top_countries_by_views);

        SHOW_STATS(null);
    }
    xmlHttp.open("GET", url.href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}

function updateRealTimeVisitors(ts_count_pairs, start, end, chart) {
    var visitors_by_ts = {};
    ts_count_pairs.forEach(function(item) {
        visitors_by_ts[item[0]] = item[1];
    });

    var labels = [];
    var data = [];
    var begin = start;
    var n = 30;
    var max = 0;
    while (begin < end) {
        var count = visitors_by_ts[~~begin.toSeconds()];
        if (count == null) {
            count = 0;
        }

        labels.push(n + " min. ago");
        data.push(count);

        if (count > max) {
            max = count;
        }

        begin = begin.plus({ minutes: 1 });
        n -= 1;
    }

    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.options.scales.y.max = max * 2;
    chart.update();
}

function refreshRealTimeStats() {
    let end = luxon.DateTime.now().toUTC();
    // Avoid showing this minute's data when displaying past data because they are still
    // changing and distort the metrics.
    end = luxon.DateTime.utc(end.year, end.month, end.day, end.hour, end.minute);
    let start = end.plus({ minutes: -30, milliseconds: 1 });

    let url = makeStatsURL();
    url.searchParams.append('window', ~~start.toSeconds() + "-" + ~~end.toSeconds());
    url.searchParams.append('period', 'real_time');
    url.searchParams.append('get_visitors', true);
    url.searchParams.append('get_top_pages_by_views', true);
    url.searchParams.append('get_top_referrers_by_views', true);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState != 4) {
            return;
        }

        if (this.status != 200) {
            SHOW_STATS("Error fetching stats: " + this.responseText);
            return;
        }

        var response = JSON.parse(this.responseText);

        var visitors = {};
        response.visitors.forEach(function(item) {
            visitors[item[0]] = item[1];
        });

        var labels = [];
        var data = [];
        var begin = start;
        var n = 30;
        var max = 0;
        while (begin < end) {
            var count = visitors[~~begin.toSeconds()];
            if (count == null) {
                count = 0;
            }
            labels.push(n + " min. ago");
            data.push(count);
            if (count > max) {
                max = count;
            }
            begin = begin.plus({ minutes: 1 });
            n -= 1;
        }

        updateRealTimeVisitors(response.visitors, start, end, REAL_TIME_ACTIVITY_CHART);

        var count = 0;
        response.visitors.forEach(function(item) { count += item[1]; });
        $('#' + REAL_TIME_ACTIVE_COUNT).text(count);

        fillTopNTable(REAL_TIME_PAGES_TABLE, response.top_pages_by_views);
        fillTopNTable(REAL_TIME_REFERRERS_TABLE, response.top_referrers_by_views);
    }
    xmlHttp.open("GET", url.href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}

function setupStats(
    loadingId, containerId,
    realTimeActivityCanvasId, realTimeActiveCountId, realTimePagesTableId, realTimeReferrersTableId,
    dailyActivityCanvasId, topViewedPagesTableId, topVotedPagesTableId,
    topReferrersTableId, topCountriesTableId,
    initialTimeWindow) {

    SHOW_STATS = function(error) {
        if (error == null) {
            $('#' + loadingId).css("display", "none");
            $('#' + containerId).css("display", "block");
        } else {
            $('#' + loadingId).text(error);
            $('#' + loadingId).css("display", "block");
            $('#' + containerId).css("display", "none");
        }
    };

    REAL_TIME_ACTIVE_COUNT = realTimeActiveCountId;

    var ctx = document.getElementById(realTimeActivityCanvasId).getContext('2d');
    REAL_TIME_ACTIVITY_CHART = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [{
                labels: [],
                data: [],
                backgroundColor: LINE_COLOR_2,
                borderColor: LINE_COLOR_2,
            }],
        },
        options: {
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                    },
                },
            },
            plugins: {
                title: {
                    display: false,
                },
                legend: {
                    display: false,
                },
            },
        },
    });

    REAL_TIME_PAGES_TABLE = $('#' + realTimePagesTableId);
    REAL_TIME_REFERRERS_TABLE = $('#' + realTimeReferrersTableId);

    var ctx2 = document.getElementById(dailyActivityCanvasId).getContext('2d');
    DAILY_ACTIVITY_CHART = new Chart(ctx2, {
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
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: function(ts) {
                            var date = luxon.DateTime.fromSeconds(ts, { zone: 'UTC' });
                            // ChartJS insists on rendering the dates as local time, so we need to
                            // tell it to round them to the day for proper alignment.  However,
                            // because our data points represent the counts for their following time
                            // period, we need to add one so that they show up correctly.
                            return date.plus({ days: 1 });
                        },
                        unit: 'day',
                        round: 'day',
                        unitStepSize: 1,
                        displayFormats: {
                            'day': 'yyyy-LL-dd',
                        },
                    },
                },
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
                    position: 'bottom',
                },
            },
        },
    });

    TOP_VIEWED_PAGES_TABLE = $('#' + topViewedPagesTableId);
    TOP_VOTED_PAGES_TABLE = $('#' + topVotedPagesTableId);
    TOP_REFERRERS_TABLE = $('#' + topReferrersTableId);
    TOP_COUNTRIES_TABLE = $('#' + topCountriesTableId);

    setTimeWindow(initialTimeWindow);

    refreshRealTimeStats();
    window.setInterval(refreshRealTimeStats, 30 * 1000);
}
