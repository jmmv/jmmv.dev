// jmmv.dev
// Copyright 2021 Julio Merino

// SITE_ID and PAGE_PATH must be defined by the caller.
const GA_ID = 'UA-63557333-1';

function addAnchorsToHeaders() {
    $('article :header').each(function() {
        var attr = $(this).attr('id');
        if (typeof attr !== typeof undefined && attr !== false) {
          $(this).append('<a class="anchor" href="#' + $(this).context.id + '">' +
            '<img src="/octicons/link.svg" aria-hidden="true">' +
            '</a>')
        }
    });
}

function addElementClasses() {
    $("blockquote").addClass("blockquote");
    $("pre.chroma").addClass("pre-scrollable");

    $("p:contains('NOTE: ')").addClass("callout callout-info");
    $("p:contains('IMPORTANT: ')").addClass("callout callout-info");
    $("p:contains('WARNING: ')").addClass("callout callout-warning");
    $("p:contains('UPDATE (')").addClass("callout callout-warning");
    $("p:contains('DANGER: ')").addClass("callout callout-danger");
    $("p:contains('DISCLAIMER: ')").addClass("callout callout-danger");
}

function getCookie(name) {
    let nameAndEqual = name + "=";
    let fields = document.cookie.split(';');
    for (let i = 0; i < fields.length; i++) {
        let field = fields[i].trim();
        if (field.startsWith(nameAndEqual)) {
            return field.substring(nameAndEqual.length);
        }
    }
    return null;
}

function setCookie(name, path, value, expiryDays) {
    if (name != "cookies_allowed" && !cookiesAllowed()) {
        console.log("Cookies not allowed; not saving " + name);
        return;
    }

    let date = new Date();
    date.setDate(date.getDate() + expiryDays);
    document.cookie = name + "=" + value + "; path=" + path + "; expires=" + date.toGMTString();
}

function deleteCookie(name, path) {
    document.cookie = name + "=" + "; path=" + path + "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function acceptCookies() {
    setCookie("cookies_allowed", "/", "true", 365);

    $("#cookie-notice").css("display", "none");

    $("#cookie-choice").replaceWith($("<p><i>Thank you!</i></p>"));
}

function rejectCookies() {
    deleteCookie("client_id", "/");

    // Disallow cookies for only a short period of time.  I'm still building interactive features
    // to vote on posts and those will need cookies, so make sure any possible returning users get
    // a chance to see that.
    setCookie("cookies_allowed", "/", "false", 15);

    // Delete all possible Google Analytics cookies per:
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage
    deleteCookie("_ga", "/");
    deleteCookie("_gid", "/");
    deleteCookie("_gat", "/");
    deleteCookie("_dc_gtm_" + GA_ID, "/");
    deleteCookie("AMP_TOKEN", "/");
    deleteCookie("_gac_" + GA_ID, "/");

    $("#cookie-choice").replaceWith($("<p><i>Preference saved. If you change your mind, \
    reload the page to see the options again.</i></p>"));
}

function cookiesAllowed() {
    return getCookie("cookies_allowed") != "false";
}

function handleSaveRequestResponse(response) {
    $('#request-id').replaceWith(response.request_id);

    if (response['requires_cookies_consent'] && getCookie("cookies_allowed") == null) {
        $('#cookie-notice').replaceWith(
            $('<p id="cookie-notice" class="callout callout-warning">This site uses cookies. \
            <a href="/privacy.html">Learn more</a> or \
            <a onclick="acceptCookies()" class="btn btn-warning">Accept \
            and dismiss 🙏</a></p>'));
    }
}

function saveRequest() {
    var clientId = getCookie("client_id");
    if (clientId == null) {
        clientId = uuidv4();
        setCookie("client_id", "/", clientId, 365);
    }

    let data = { path: PAGE_PATH, client_id: clientId };
    if (document.referrer != "") {
        data["referrer"] = document.referrer;
    }

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var response;
            if (this.status == 200 || this.status == 201) {
                response = JSON.parse(this.responseText);
            } else {
                response = {
                    request_id: 'FAILED',
                    requires_cookies_consent: true,
                };
            }
            handleSaveRequestResponse(response);
        }
    }
    xmlHttp.open(
        "POST",
        "https://api.jmmv.dev/api/sites/" + SITE_ID + "/requests",
        true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(JSON.stringify(data));
}

var VOTING = false;

function vote(reaction, button_id, counter_id) {
    if (VOTING) {
        return;
    }
    VOTING = true;

    let vote_id = getCookie("vote_id");
    if (vote_id != null) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status != 200) {
                    console.log("Failed to clear previous vote: " + this.responseText);
                }

                var previous = getCookie("vote_reaction");
                deleteCookie("vote_id", PAGE_REL_PATH);
                deleteCookie("vote_reaction", PAGE_REL_PATH);
                VOTING = false;

                if (previous != reaction) {
                    vote(reaction, button_id, counter_id);
                } else {
                    loadVotes();
                }
            }
        }
        xmlHttp.open(
            "DELETE",
            "https://api.jmmv.dev/api/sites/" + SITE_ID + "/votes/" + vote_id,
            true);
        xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlHttp.send();
        return;
    }

    var clientId = getCookie("client_id");

    let data = { path: PAGE_PATH, client_id: clientId, reaction: reaction };

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var response;
            if (this.status == 200 || this.status == 201) {
                response = JSON.parse(this.responseText);
                setCookie("vote_id", PAGE_REL_PATH, response.vote_id, 10000);
                setCookie("vote_reaction", PAGE_REL_PATH, reaction);
                loadVotes();
            }
            VOTING = false;
        }
    }
    xmlHttp.open(
        "POST",
        "https://api.jmmv.dev/api/sites/" + SITE_ID + "/votes",
        true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(JSON.stringify(data));
}

function voteThumbsUp() {
    vote('ThumbsUp', 'thumbs-up-btn', 'thumbs-up-count');
}

function voteThumbsDown() {
    vote('ThumbsDown', 'thumbs-down-btn', 'thumbs-down-count');
}

function loadVotes() {
    var reaction = getCookie("vote_reaction");
    if (reaction == null) {
        $('#thumbs-up-btn').removeClass('btn-success');
        $('#thumbs-up-btn').addClass('btn-outline-success');
        $('#thumbs-down-btn').removeClass('btn-danger');
        $('#thumbs-down-btn').addClass('btn-outline-danger');
    } else if (reaction == "ThumbsUp") {
        $('#thumbs-up-btn').removeClass('btn-outline-success');
        $('#thumbs-up-btn').addClass('btn-success');
        $('#thumbs-down-btn').removeClass('btn-danger');
        $('#thumbs-down-btn').addClass('btn-outline-danger');
    } else if (reaction == "ThumbsDown") {
        $('#thumbs-up-btn').removeClass('btn-success');
        $('#thumbs-up-btn').addClass('btn-outline-success');
        $('#thumbs-down-btn').removeClass('btn-outline-danger');
        $('#thumbs-down-btn').addClass('btn-danger');
    }

    var clientId = getCookie("client_id");

    let url = new URL("https://api.jmmv.dev/api/sites/" + SITE_ID + "/votes");
    url.searchParams.append("path", PAGE_PATH);
    url.searchParams.append("client_id", clientId);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var response;
            if (this.status == 200) {
                response = JSON.parse(this.responseText);
                if (response.votes.ThumbsUp == null) {
                    $('#thumbs-up-count').text(0);
                } else {
                    $('#thumbs-up-count').text(response.votes.ThumbsUp);
                }
                if (response.votes.ThumbsDown == null) {
                    $('#thumbs-down-count').text(0);
                } else {
                    $('#thumbs-down-count').text(response.votes.ThumbsDown);
                }
            } else {
                console.log("Error fetching votes: " + this.responseText);
            }
        }
    }
    xmlHttp.open("GET", url.href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}

function gaRequest() {
    if (cookiesAllowed()) {
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', GA_ID);
    } else {
        window['ga-disable-' + GA_ID] = true;
    }
}
