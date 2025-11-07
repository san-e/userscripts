// ==UserScript==
// @name         Opencast Subtitle Search
// @namespace    https://github.com/san-e
// @version      1.2
// @description  Add a subtitle search box below the player. Clicking a subtitle jumps to the corresponding timecode. For when you remember the prof said something, but not when.
// @author       Tim Jarzev
// @include      https://tuwel.tuwien.ac.at/mod/opencast/*
// @grant        none
// ==/UserScript==


function stripVTT(vtt) {
    const result = [];
    const lines = vtt.split("\n");

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("-->") && i + 1 < lines.length) {
            result.push(lines[i] + "|" + lines[i + 1]);
            i++;
        } else if (lines[i].trim() !== "") {
            result.push(lines[i]);
        }
    }

    return result;
}

function parseTimecode(timecode) {
    var a = timecode.split(":");
    var h = parseInt(a[0]);
    var m = parseInt(a[1]);
    var s = parseInt(a[2].split(".")[0]);
    var ms = parseFloat("0." + a[2].split(".")[1]);
    return h * 60 * 60 + m * 60 + s + ms;
}

function seek(seconds) {
    window.player.videoContainer.streamProvider.setCurrentTime(seconds);
}


setTimeout((function() {
    'use strict';
    window.player = document.getElementById("player-iframe").contentWindow.__paella_shortcuts_player__;
    const player = window.player;

    fetch(player.videoManifest.captions[0].url)
        .then(function(response) {
            response.text().then(function(raw_vtt_subtitles) { // bullshit
    var stripped_vtt = stripVTT(raw_vtt_subtitles);
    const container = document.createElement('div');
    container.id = "sub-search-container";
    container.innerHTML = `
    <style>
        body {
            padding-bottom: 20px;
        }
        .scrollable-list {
            height: 400px;
            overflow-y: auto;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            border-top-left-radius: 0px;
            border-top-right-radius: 0px;
            padding: 10px;
            font-family: Arial, sans-serif;
            margin: 20px auto;
            margin-top: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 99;
        }
        .list-item {
            border-radius: 8px;
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        .list-item:hover {
            background: #D3D3D3;
            background: linear-gradient(90deg, rgba(211, 211, 211, 0.8) 0%, rgba(211, 211, 211, 0.5) 50%);
        }
        .list-item:last-child {
            border-bottom: none;
        }
        .timestamp-pill {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 50px;
            background-color: #006699;
            color: white;
            font-size: 12px;
            margin-right: 15px;
            min-width: 60px;
            text-align: center;
        }
        .item-text {
            flex: 1;
        }

        .sub-search {
            background: #fff;
            border: 1px solid #ddd;
            border-top-left-radius: 8px;
            padding: 10px;
            font-family: Arial, sans-serif;
            margin: 20px auto;
            margin-bottom: 0px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);

            /* magnifying glass von font awesome */
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3C!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--%3E%3Cpath d='M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z'/%3E%3C/svg%3E");
            padding-left: 50px;
            background-size: 20px;
            background-repeat: no-repeat;
            background-position: 2% 50%;
            background-blend-mode: multiply;
            float:left;
            width: 67%;
            height: 50px;
        }

        .sub-select {
            float: left;
            display: inline;
            width: 33%;
            background: #fff;
            border: 1px solid #ddd;
            border-top-right-radius: 8px;
            padding: 10px;
            font-family: Arial, sans-serif;
            margin: 20px auto;
            margin-bottom: 0px;
            height: 50px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .padding {
            padding-bottom: 20px;
        }
        </style>
        <div class="sub-search-box" id="sub-search-box"></div>
        <div class="scrollable-list" id="scrollableList"></div>
        <div class="padding"></div>
    `;
    document.getElementsByClassName("player-wrapper")[0].appendChild(container);

    let items = [];
    function aaa(){
        var timecode, sub;
        stripped_vtt.forEach((line) => {
            if(!line.includes("|")) {
                return;
            }
            timecode = line.split("-->")[0].trim();
            sub = line.split("|")[1].trim();
            items.push([timecode, sub])
        })
    }
    aaa();

    const list = document.getElementById('scrollableList');

    function renderList(filter = "") {
        list.innerHTML = "";
        items.forEach((item) => {
            let tc = item[0];
            let subtitle = item[1];
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.addEventListener("click", () => {
                seek(parseTimecode(tc));
            });

            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp-pill';
            timestamp.textContent = tc;

            const itemText = document.createElement('div');
            itemText.className = 'item-text';
            itemText.textContent = subtitle;

            listItem.appendChild(timestamp);
            listItem.appendChild(itemText);
            if (filter == "") {
                list.appendChild(listItem);
            } else if (subtitle.toLowerCase().includes(filter.toLowerCase())) {
                list.appendChild(listItem);
            }
        });
    }
    window.renderList = renderList;
    renderList();

    let searchBoxContainer = document.getElementById("sub-search-box");
    let searchBox = document.createElement("input");
    searchBox.className = "sub-search";
    searchBox.addEventListener("input", () => {renderList(searchBox.value);});
    searchBoxContainer.appendChild(searchBox);

    let subSelectDropdown = document.createElement("select");
    subSelectDropdown.className = "sub-select"
    player.videoManifest.captions.forEach((captionElement, i) => {
        let option = document.createElement("option");
        option.value = i;
        option.innerHTML = captionElement["text"];
        subSelectDropdown.appendChild(option);
    })

    subSelectDropdown.addEventListener("change", () => {
        fetch(player.videoManifest.captions[parseInt(subSelectDropdown.value)].url)
            .then(function(response) {
                response.text()
            .then(function(raw_vtt_subtitles) {
                stripped_vtt = stripVTT(raw_vtt_subtitles);
                items = [];
                aaa();
                renderList();
            })});
    })
    searchBoxContainer.appendChild(subSelectDropdown);

})})}), 1000);

