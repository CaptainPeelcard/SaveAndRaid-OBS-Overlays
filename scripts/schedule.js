let zone = new Date().toLocaleTimeString(undefined,{timeZoneName:'short'}).split(' ')[2]
let previousLive = undefined;

const schedule = (() => {
    let currentSchedule = "";
    let scheduledLiveNow = "";
    let scheduledNext = "";
    let isScheduleChanged = false;

    async function SubscribeSchedule(lastMessage = "") {
        let response = await fetch(`${scheduleUrl}?key=${apiKey}`);

        if (response.status === 502) {
                // Status 502 is a connection timeout error.
            await SubscribeSchedule();
        } else if (response.status !== 200) {
                // An error, send it to the console.
            console.log(response.statusText);
                // Reconnect in one second.
            await new Promise(resolve => setTimeout(resolve, 1000));
            await SubscribeSchedule();
        } else {
                // Get and show the message.
            let message = await response.text();

            if (message !== lastMessage) {
                currentSchedule = JSON.parse(message)["data"];

                if (lastMessage !== "")
                    isScheduleChanged === true;
            }

                // Subscribe again to get the next message.
            setTimeout(() => {SubscribeSchedule(message)}, 300000);
        }
    }
    return {
        isScheduleChanged,
        GetLiveNow: async (filterDate) => {
            if (currentSchedule === "")
                await SubscribeSchedule();

            scheduledLiveNow = currentSchedule.filter(item => Date.parse(filterDate) >= Date.parse(item.utc_start_date_time)
                && Date.parse(filterDate) < Date.parse(item.utc_end_date_time));
            scheduledNext = currentSchedule.slice(scheduledLiveNow.length === 0 ? 0 : scheduledLiveNow[0].index);
            
            return scheduledLiveNow[0];
        },
        GetUpNext: async () => {
            if (scheduledNext === "")
                await GetLiveNow();
            
            return scheduledNext;
        },
        ProcessedChange: () => {
            schedule.isScheduleChanged = false;
        }
    }
})();

async function GetLiveStatus(streamerName) {
    let response = await fetch(`${streamInfoUrl}?channel=${streamerName}`);

    if (response.status === 502) {
            // Status 502 is a connection timeout error.
        
        return false;
    } else if (response.status !== 200) {
            // An error, send it to the console.
        console.log(response.statusText);
        
        return false;
    } else {
            // Get and show the message.
        let message = await response.text();

        if (message === "")
            return false;
        
        let streamInfo = JSON.parse(message)["data"];
        
        if (streamInfo.length === 0)
            return false;

        return streamInfo[0].type === "live"
    }
}

const testDate = (() => {
    let date = null;
    let offset = 0;
    return {
        offset,
        SetDate: (inputDate) => {
            testDate.date = Date.parse(new Date(inputDate).toUTCString());
            testDate.offset = testDate.date - Date.now();
        },
        GetDate: (utc = false) => {
            if (testDate.date === null)
                return "test date is not set";

            return utc === true
                ? new Date(testDate.date).toUTCString()
                : new Date(testDate.date).toString();
        },
        GetElapsedDate: (utc = false) => {
            return utc === true
                ? new Date((Date.now() + testDate.offset)).toUTCString()
                : new Date((Date.now() + testDate.offset)).toString();
        },
        UnsetDate: () => {
            testDate.date = null;
            testDate.offset = 0;
        }
    }
})();

async function UpdateSchedule() {
    let live = await schedule.GetLiveNow(new Date(Date.now() + testDate.offset).toISOString());
    let upcomingStreams = await schedule.GetUpNext();;
    
    if (live === undefined)
        $("#liveContainer").css("display", "none");

    if ((live !== undefined && $("#liveContainer").css("display") === "none") || (previousLive !== undefined && live.utc_start_date_time !== previousLive.utc_start_date_time)) {
        if ($("#liveNow").find(".streamer-name").text() === "" || Date.parse(live.utc_start_date_time) !== Date.parse(previousLive.utc_start_date_time)) {
            $("#liveNow").find(".schedule-time").text(`${formatDate(live.utc_start_date_time)} - ${formatDate(live.utc_end_date_time, true)} (${zone})`);
            $("#liveNow").find(".streamer-name").text(live.streamer);
            $("#liveNow").find(".profile-pic").css("background-image", `url('${live.profile_image_url}')`);
            $("#liveNow").find(".schedule-description").text(UnEscape(live.description));

            if (live.description !== "")
                $("#liveNow").find(".schedule-description").css("display", "block");

            $("#liveNow").find(".live-indicator").css("display", "none");
            
            $("#liveContainer").css("display", "flex");
        }

        if (previousLive === undefined || live.utc_start_date_time !== previousLive.utc_start_date_time) {
            let upcomingLength = $("#schedulePanels").children().length;
            while (upcomingStreams.length < upcomingLength) {
                $("#schedulePanels").children()[0].remove();
                upcomingLength = $("#schedulePanels").children().length;
            }
        }
    }

    if (live !== undefined && $("#liveNow").find(".alert-indicator").css("display") === "none") {
        let isLive = await GetLiveStatus(live.streamer);

        if (isLive === true)
            $("#liveNow").find(".alert-indicator").css("display", "block");
    }

    previousLive = live;

    if (schedule.isScheduleChanged === true) {
        $("#schedulePanels").empty();
        schedule.ProcessedChange();
    }

    if ($("#schedulePanels").children().length === 0 && upcomingStreams !== undefined)
        upcomingStreams.forEach((stream) => {
            let streamPanel = $("<div class='schedule-panel row d-flex flex-column w-100 my-1 p-1 overflow-hidden'>")
                .attr("id", `stream-${stream.id}`)
                .css({"display": "flex",
                    "background": GetRandomGradient('var(--infoPanel-background-color)', 'var(--infoPanel-gradient-color)')})
                .append($("<div class='col w-100 position-relative'>")
                    .append($("<div class='row w-100 px-1'>")
                        .append($("<div class='schedule-info col h-100 text-truncate d-block py-3'>")
                            .append($("<div class='schedule-time row w-100 fw-bold'>").text(`${formatDate(stream.utc_start_date_time)} - ${formatDate(stream.utc_end_date_time, true)} (${zone})`))
                            .append($("<div class='streamer-name row w-100 fw-bolder overflow-none text-uppercase text-truncate d-block h4'>").text(stream.streamer)))
                        .append($("<div class='pfp-container d-flex col-2 h-100 p-1 m-0'>")
                            .append($("<div class='profile-pic ratio ratio-1x1'>")
                                .css("background-image", `url('${stream.profile_image_url}')`))))
                    .append($("<div class='schedule-description row overflow-none text-truncate px-1'>").text(UnEscape(stream.description)))
                    .append($("<i class='live-indicator fa-solid fa-circle position-absolute top-0 end-0 me-1 mt-1 fw-bolder' title='live'>")));

                if (stream.description !== "")
                    $(streamPanel).find(".schedule-description").css("display", "block");

                $(streamPanel).click(function () {ShowScheduleDetails(this)});
                $("#schedulePanels").append(streamPanel);
        });

        if (live !== undefined && $("#schedulePanels").children().length > 0 && $($("#schedulePanels").children()[0]).find(".live-indicator").css("display") === "none") {
            let isLive = await GetLiveStatus(upcomingStreams[0].streamer);

            console.log(isLive);

            if (isLive === true)
                $($("#schedulePanels").children()[0]).find(".live-indicator").css("display", "block");
        }

    await new Promise(resolve => setTimeout(resolve, 10000));
    UpdateSchedule();
}