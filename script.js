// jmmv.dev
// Copyright 2021 Julio Merino

// Base URL of the API service.
const API_BASE_URL = 'https://api.jmmv.dev/api';

// The client ID as loaded by loadClientId().
var CLIENT_ID = null;

function makeRequestsURL() {
    return new URL(API_BASE_URL + "/sites/" + SITE_ID + "/pages/" + PAGE_PATH + "/requests");
}

function makeVotesURL() {
    return new URL(API_BASE_URL + "/sites/" + SITE_ID + "/pages/" + PAGE_PATH + "/votes");
}

function makeVoteURL(clientId) {
    return new URL(API_BASE_URL +  "/sites/" + SITE_ID + "/pages/" + PAGE_PATH
        + "/clients/" + clientId + "/vote");
}

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
    let date = new Date();
    date.setDate(date.getDate() + expiryDays);
    document.cookie = name + "=" + value + "; path=" + path + "; expires=" + date.toGMTString();
}

function deleteCookie(name, path) {
    document.cookie = name + "=" + "; path=" + path + "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function fingerprintToClientId(confidence, visitorId) {
    if (confidence < 0.5) {
        return uuidv4();
    }

    let fp = visitorId.substr(0, 32)
    while (fp.length < 32) {
        fp += '0';
    }
    return fp.substr(0, 8) + '-' + fp.substr(8, 4) + '-' + fp.substr(12, 4)
        + '-' + fp.substr(16, 4) + '-' + fp.substr(20, 12);
}

function loadClientId(hook) {
    CLIENT_ID = getCookie("client_id");
    if (CLIENT_ID == null) {
        FingerprintJS.load().then(fp => fp.get()).then(function(result) {
            CLIENT_ID = fingerprintToClientId(result.confidence.score, result.visitorId);
            hook();
        });
    } else {
        hook();
    }
}

function saveRequest() {
    let data = { client_id: CLIENT_ID };
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

            if (!response['requires_cookies_consent'] && CLIENT_ID != null) {
                setCookie("client_id", "/", CLIENT_ID, 365);
            }
        }
    }
    xmlHttp.open("POST", makeRequestsURL().href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(JSON.stringify(data));
}

function deleteVote(callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status != 200) {
                console.log("Failed to clear previous vote: " + this.responseText);
            }

            callback();
        }
    }
    xmlHttp.open("DELETE", makeVoteURL(CLIENT_ID).href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}

var VOTING = false;
var CURRENT_REACTION = null;

function vote(reaction, buttonId, counterId) {
    if (VOTING) {
        return;
    }
    VOTING = true;

    if (CURRENT_REACTION == null) {
        // Nothing to delete.
    } else if (CURRENT_REACTION == reaction) {
        deleteVote(function() {
            VOTING = false;
            CURRENT_REACTION = null;
            loadVotes();
        });
        return;
    } else if (CURRENT_REACTION != reaction) {
        deleteVote(function() {
            VOTING = false;
            CURRENT_REACTION = null;
            vote(reaction, buttonId, counterId);
        });
        return;
    }

    let data = { reaction: reaction };

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            VOTING = false;
            loadVotes();

            if (reaction == 'ThumbsUp') {
                $('#vote-request').text("Thank you! Please spread the word and share this post " +
                    "elsewhere!");
            }
        }
    }
    xmlHttp.open("POST", makeVoteURL(CLIENT_ID).href, true);
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
    let url = makeVotesURL();
    url.searchParams.append("client_id", CLIENT_ID);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var response;
            if (this.status == 200) {
                response = JSON.parse(this.responseText);

                var zeroVotes = true;
                if (response.votes.ThumbsUp == null) {
                    $('#thumbs-up-count').text(0);
                } else {
                    $('#thumbs-up-count').text(response.votes.ThumbsUp);
                    zeroVotes = false;
                }
                if (response.votes.ThumbsDown == null) {
                    $('#thumbs-down-count').text(0);
                } else {
                    $('#thumbs-down-count').text(response.votes.ThumbsDown);
                    zeroVotes = false;
                }

                if (zeroVotes) {
                    $('#first-vote').text('Be the first one to vote!');
                } else {
                    $('#first-vote').text('');
                }

                if (response.client_reaction == null) {
                    $('#thumbs-up-btn').removeClass('btn-success');
                    $('#thumbs-up-btn').addClass('btn-outline-success');
                    $('#thumbs-down-btn').removeClass('btn-danger');
                    $('#thumbs-down-btn').addClass('btn-outline-danger');
                } else if (response.client_reaction == "ThumbsUp") {
                    $('#thumbs-up-btn').removeClass('btn-outline-success');
                    $('#thumbs-up-btn').addClass('btn-success');
                    $('#thumbs-down-btn').removeClass('btn-danger');
                    $('#thumbs-down-btn').addClass('btn-outline-danger');
                } else if (response.client_reaction == "ThumbsDown") {
                    $('#thumbs-up-btn').removeClass('btn-success');
                    $('#thumbs-up-btn').addClass('btn-outline-success');
                    $('#thumbs-down-btn').removeClass('btn-outline-danger');
                    $('#thumbs-down-btn').addClass('btn-danger');
                }
                CURRENT_REACTION = response.client_reaction;
            } else {
                console.log("Error fetching votes: " + this.responseText);
            }
        }
    }
    xmlHttp.open("GET", url.href, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send();
}
