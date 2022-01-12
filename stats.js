// jmmv.dev
// Copyright 2022 Julio Merino

// WARNING: This file requires script.js to be loaded first.

// Primary color used to draw chart lines.  Should match whatever is defined in main.scss.
LINE_COLOR = 'rgb(0, 60, 100)';

// Time window to request from the server.
TIME_WINDOW_START = null;
TIME_WINDOW_END = null;

// Chart to draw the daily page views on.
DAILY_PAGE_VIEWS_CHART = null;

function makeStatsURL() {
    return new URL(API_BASE_URL + "/sites/" + SITE_ID + "/stats");
}

function setTimeWindow(days) {
    let end = new Date();
    let start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    TIME_WINDOW_START = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    TIME_WINDOW_END = end;

    refreshStats();
}

function refreshStats() {
    let url = makeStatsURL();
    url.searchParams.append('time_window_start', Math.floor(TIME_WINDOW_START.getTime() / 1000));
    url.searchParams.append('time_window_end', Math.floor(TIME_WINDOW_END.getTime() / 1000));

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
        DAILY_PAGE_VIEWS_CHART.data.datasets[0].data = response.daily_page_views;
        DAILY_PAGE_VIEWS_CHART.update();
    }
    xmlHttp.open("GET", url.href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}

function setupStats(dailyPageViewsCanvasId) {
    const ctx = document.getElementById(dailyPageViewsCanvasId).getContext('2d');
    DAILY_PAGE_VIEWS_CHART = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Page views',
                data: [],
                backgroundColor: LINE_COLOR,
                borderColor: LINE_COLOR,
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
                    text: 'Total page views per day',
                },
                legend: {
                    display: false,
                },
            },
        },
    });

    setTimeWindow(30);
}
