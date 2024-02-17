let donationPanelQuantity = 0;
let alertDimensionsAdjusted = false;

    // Subscribe to donations API and refresh every 1 seconds. Queue alerts if there are new donations.
        // mode: alerts, history
        // lastMessage: text value of previous ressponse
        // lastDonation: JObject of last donation data.
async function SubscribeDonations(lastMessage = "", lastDonation) {
    let response = await fetch(`${donationsUrl}?key=${apiKey}${mode === "alerts" ? "&limit=25" : ""}`);

    if (response.status === 502) {
            // Status 502 is a connection timeout error.
        await SubscribeDonations(lastMessage, lastDonation);
    } else if (response.status !== 200) {
            // An error, send it to the console.
        console.log(response.statusText);
            // Reconnect in one second.
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SubscribeDonations(lastMessage, lastDonation);
    } else {
            // Get and process the message.
        let message = await response.text();
        
        let newestDonation = lastDonation === null
            ? null
            : lastDonation;

            // Process if data has changed.
            // One time Do-While loop for easy break condition.
        if (message !== lastMessage) {
            let donations = JSON.parse(message).data;

                // Get the newest donation for keeping position.
            newestDonation = donations.length === 0
                ? null
                : donations[0];

                // Set lastDonation to newestDonation on the first run.
            lastDonation = lastDonation === null
                ? newestDonation
                : lastDonation;
                
                // Send all donation data to update any changes in the list.
            if (mode === "history")
                UpdateDonations(donations);

                // Don't send alerts on first fetch. Send alerts once new data is received.
            if (mode === "alerts") {
                    // Look for alerts with newer date.
                newAlerts = donations.filter( ({ created }) => Date.parse(created) > Date.parse(lastDonation.created) );
                    // Send the new donations if there are any
                if (newAlerts.length > 0)
                    UpdateDonations(newAlerts);
            }
        }

            // Subscribe again to get the next message.
        await setTimeout(() => {SubscribeDonations(message, newestDonation)}, 1000);
    }
}

    // Update alert/history widget with donation data.
async function UpdateDonations(donations) {
    donations.reverse();
    let updateDelay = animations === true ? 1000 : 0;
    let donationPanels = $("#donationPanels").children("div");

        // Clear all panels if information has been removed. Edge case.
    if (mode === "history" && donations.length === 0)
        $("#donationPanels").empty();

        // Calculate number of newest panels that can be shown for history.
    let minShowIndex = fitToWindow === true
        ? Math.max(0, (donations.length - donationPanelQuantity))
        : 0

        // Process information for all donations. Update info in history mode and queue new alerts in alert mode.
        donations.forEach((donation, index) => {
        let newPanel = null;

            // Define new panel html.
        if (mode === "alerts" || index + 1 > donationPanels.length)    
            newPanel = $("<div class='infoPanel row overflow-hidden justify-content-center align-items-center my-1 animated zoomIn'>")
                .attr("id", donation.guid)
                .css({
                    "height": "var(--infoPanel-alert-height)",
                    "width": "100%",
                    "background": GetRandomGradient('var(--infoPanel-background-color)', 'var(--infoPanel-gradient-color)')
                })
                .append($("<div class='donationTotal d-flex justify-content-center align-items-center'>")
                    .text( "$" + parseFloat(donation.amount.replace(/,/g,"").replace(/\.0$/,"")).toLocaleString("en", {useGrouping:true}) ))
                .append($("<div class='donationName d-flex justify-content-center align-items-center text-truncate text-uppercase'>")
                    .text(donation.donor_name))
                .append($("<figure class='donationText text-end my-1'>")
                    .append($("<blockquote class='blockquote text-truncate text-uppercase'>")
                        .append($("<span class='donationTotal'>").text( "$" + parseFloat(donation.amount.replace(/,/g,"").replace(/\.0$/, "")).toLocaleString("en", {useGrouping:true}) ))
                        .append($("<span class='divider'>").text("   --   "))
                        .append($("<span class='donationName'>").text(donation.donor_name)))
                    .append($("<figcaption class='donationMessage blockquote-footer text-truncate text-uppercase'>")
                        .text(UnEscape(donation.donor_comment))
                        .css("display", donation.donor_comment === "" ? "none" : "block")));

            // Update data for existing panel.
        if (newPanel === null) {
                // Remove donations that have been deleted.
            if (donation.guid !== $(donationPanels[index]).attr("id") ) do {
                donationPanels[index].remove();
                donationPanels = $("#donationPanels").children("div");
            } while (donation.guid !== $(donationPanels[index]).attr("id") || donationPanels.length === 0)

                // Update information in existing panel.
            let donationTotals = donationPanels[index].querySelectorAll(".donationTotal");
            let donationNames = donationPanels[index].querySelectorAll(".donationName");
            let donationMessage = donationPanels[index].querySelector(".donationMessage");
            let donationTotalText = "$" + parseFloat(donation.amount.replace(/,/g,"").replace(/\.0$/, "")).toLocaleString("en", {useGrouping:true});
            let donationMessageText = UnEscape(donation.donor_comment);

            if (donationTotalText !== donationTotals[0].innerHTML || donation.donor_name !== donationNames[0].innerHTML || donationMessageText !== donationMessage.innerHTML) {
                $(`#${donation.guid}`).addClass("zoomOut").removeClass("zoomIn");
                
                    // Reload the panel if it will fit.
                    // TODO find another way to reload CSS behavior when using add/remove class.
                if (index >= minShowIndex)
                    $(`#${donation.guid}`).css("display", "flex");

                setTimeout(() => {
                    donationMessage.innerHTML = donationMessageText;
                    $(`#${donation.guid}`).css("display", donationMessageText === "" ? "none" : "block" );

                    donationTotals.forEach(total => {
                        total.innerHTML = donationTotalText;
                    });
                    donationNames.forEach(name => {
                        name.innerHTML = donation.donor_name;
                    });

                    $(`#${donation.guid}`)
                        .css("background", GetRandomGradient('var(--infoPanel-background-color)', 'var(--infoPanel-gradient-color)'))
                        .addClass("zoomIn").removeClass("zoomOut");
                }, updateDelay);
            }

                // Check to show or hide the panel so we are showing the newest entries with fitToWinow.
            setTimeout(() => {
                if (index >= minShowIndex)
                    $(`#${donation.guid}`).css("display", "flex");
                else
                    $(`#${donation.guid}`).css("display", "none");

                    // Another strange issue OBS browser will not handle the above if/else which works in other browsers. The below workaround to remove the panel works.
                if (navigator.userAgent.indexOf("OBS") >= 0) {
                    $(donationPanels[index]).remove();
                }
                
            }, updateDelay + 500);
        }

            // Insert, show and scroll to the new panel.
        if (mode === "history" && newPanel !== null) {
                // Add the panel to the bottom of the hostory
            $("#donationPanels").append(newPanel);
            donationPanels = $("#donationPanels").children("div");

                // Show the panel if it will fit. Delay it to line up with the entracne of updated panel animations.
            if (index >= minShowIndex)
                setTimeout(() => {
                    $(`#${donation.guid}`).css("display", "flex");
                    $("#donationPanels").scrollTop($("#donationPanels")[0].scrollHeight);
                }, updateDelay);
            }

        if (mode === "alerts") {
            alerts.QueueAlert(async () => {
                let donationSoundLastPlayed = localStorage.getItem("donationSoundLastPlayed");
                donationSoundLastPlayed = donationSoundLastPlayed === null
                    ? 0
                    : parseInt(donationSoundLastPlayed, 10);
    
                    // Play sound if sound is enabled, the below conversion of autoPlay to string is a wienrd bug that only happens in OBS. Other browsers see this globally as a bool as expected.            
                if (audioEnabled.toLocaleString() === "true" && donationSoundLastPlayed + soundPlayInterval <= Date.now()) {
                    donationSound.play();
                    donationSoundLastPlayed = Date.now();
                    localStorage.setItem("donationSoundLastPlayed", donationSoundLastPlayed);
                }
                
                $("#donationPanels").append(newPanel);
                donationPanels = $("#donationPanels").children("div");

                    // Show the panel if it will fit. Delay it to line up with the entracne of updated panel animations.
                $(`#${donation.guid}`).css("display", "flex");
                
                    // Don't await final exit animations
                setTimeout(() => {
                        // Fade out child text elements
                    $(`#${donation.guid}`).children().each((index, childData) => {
                        $(childData).css({
                            "transition": "all 500ms ease-in-out",
                            "opacity": 0
                        });
                    });
                    
                        // Update all elements with
                    $(`#${donation.guid}`).prepend(
                        $("<div class='alert-exit'>")
                        .css({
                            "background": "var(--infoPanel-background-color)",
                            "position": "absolute",
                            "top": "0%",
                            "left": "50%",
                            "transform": "translateX(-50%)",
                            "height": "100%",
                            "width": "100%"
                        })
                    );
                        
                    setTimeout(() => {
                        $(`#${donation.guid} > .alert-exit`).css({
                            "transition": "all 1000ms ease-in-out",
                            "width": "var(--infoPanel-alert-height)",
                            "border-radius": "50%"
                        });

                        $(`#${donation.guid}`).css({
                            "overflow": "hidden",
                            "transition": "all 1000ms ease-in-out",
                            "width": "var(--infoPanel-alert-height)",
                            "background": "rgba(0,0,0,0)",
                            "background-image": "var(--theme-alert-gif)",
                            "background-repeat": "no-repeat",
                            "background-size": "contain",
                            "background-position": "center"
                        });
                    }, 100);
                        
                        
                    setTimeout(() => {
                        $(`#${donation.guid} > .alert-exit`).css("display", "none");
                    }, 1000);
                    setTimeout(() => {
                        $(`#${donation.guid}`).remove();
                    }, 2500);
                }, 5000);

                await new Promise(resolve => setTimeout(resolve, 8000));
            });
        }
    });

        // Resize widget when loading data the first time, fitToWindow must be set to true in page script.
    if (mode === "history" && fitToWindow === true && alertDimensionsAdjusted === false) {
        donationPanelQuantity = await ResizeDonations();
        if (donationPanelQuantity > 0)
            alertDimensionsAdjusted = true;
    }
}

    // Set border size to fit maximum number of panels that will can be shown, and the max number of panels.
async function ResizeDonations() {
    let panels = $("#donationPanels").children("div");
    let panelModified = false;
    let maxPanels = 0;

    if (mode === "alerts")
        return maxPanels;
    
    if (panels.length > 0) {
        let bodyPadding = parseFloat($("body").css("padding-top").replace("px", ""))
            + parseFloat($("body").css("padding-bottom").replace("px", ""));
        let containerWhitespace = parseFloat( $("#donations > div").css("margin-top").replace("px", ""))
            + parseFloat($("#donations > div").css("margin-bottom").replace("px", ""))
            + parseFloat($("#donations > div").css("padding-top").replace("px", ""))
            + parseFloat($("#donations > div").css("padding-bottom").replace("px", ""));
        let titlePanelHeight = parseFloat($("#donationsTitle").css("margin-top").replace("px", ""))
            + parseFloat($("#donationsTitle").css("margin-bottom").replace("px", ""))
            + parseFloat($("#donationsTitle").css("height").replace("px", ""));
        
        let panel = $(panels[0]);
        if (panel.css("display") === "none") {
            panel.css({
                display: "flex",
                opacity: 0
            });

            panelModified = true;
        }

        let panelHeight = 3 + parseFloat(panel.css("height").replace("px", ""))
        let panelMarginTop = parseFloat(panel.css("margin-top").replace("px", ""));
        let panelMarginBottom = parseFloat(panel.css("margin-bottom").replace("px", ""));
        panelHeight = panelMarginTop > panelMarginBottom
            ? panelHeight + panelMarginTop
            : panelHeight + panelMarginBottom;
        
            // TODO find where extra padding/margin is coming from for dynamic calculation. 10px has been added for now.
        let panelAreaHeight = $(window).innerHeight() - bodyPadding - containerWhitespace - titlePanelHeight;

        if (panelModified === true)
            panel.css({
                display: "none",
                opacity: 1
            });

        maxPanels = Math.floor(panelAreaHeight / panelHeight);

        let showPanels = maxPanels === 0
            ? null
            : panels.slice((donationPanelQuantity * -1));

        
        panels.each((index, hiddenPanel) => {
            if (index <= (panels.length - (showPanels === null ? 0: showPanels.length)))
                $(hiddenPanel).css("display", "none");
        });
        
        if (showPanels !== null)
            showPanels.each((index, hiddenPanel) => {
                $(hiddenPanel).css("display", "flex");
            });

        let borderHeight = ((panelHeight) * maxPanels) + (panelMarginTop * 2) + (panelMarginBottom * 2);
        $("#donationsContainer").css("height", `${borderHeight}px`);
    }

    return maxPanels;
}

async function TestDonations() {
    const data1 = mode === "alerts"
        ? JSON.parse(
            '{ \
                "data": [ \
                    { \
                        "index": 1, \
                        "currency": "USD", \
                        "amount": "1.00", \
                        "donor_name": "Anonymous", \
                        "donor_comment": "", \
                        "created": "2024-01-10 10:18:14", \
                        "guid": "aaaf8b272dd-ff00-446c-aabe-7b5d0be22827" \
                    } \
                ] \
            }')
        : JSON.parse(
            '{ \
                "data": [ \
                    { \
                        "index": 1, \
                        "currency": "USD", \
                        "amount": "1.00", \
                        "donor_name": "Anonymous", \
                        "donor_comment": "eyo", \
                        "created": "2024-01-10 10:18:14", \
                        "guid": "f8b272dd-ff00-446c-aabe-7b5d0be22827" \
                    } \
                ] \
            }')

    const data2 = JSON.parse(
        '{ \
            "data": [ \
                { \
                    "index": 1, \
                    "currency": "USD", \
                    "amount": "100.00", \
                    "donor_name": "DaggerJoe", \
                    "donor_comment": "Follow the freeman!", \
                    "created": "2024-02-09 00:26:05", \
                    "guid": "df6a03eb-8e44-44ff-9db7-7880e8400db3" \
                }, \
                { \
                    "index": 2, \
                    "currency": "USD", \
                    "amount": "69.00", \
                    "donor_name": "Joe_mama", \
                    "donor_comment": "nice", \
                    "created": "2024-02-06 22:48:29", \
                    "guid": "92630ebd-1bb2-4e4c-9a02-8d70d44348ec" \
                }, \
                { \
                    "index": 3, \
                    "currency": "USD", \
                    "amount": "10.00", \
                    "donor_name": "Anonymous", \
                    "donor_comment": "", \
                    "created": "2024-02-03 18:20:50", \
                    "guid": "46757b3d-50ee-4c1e-acbe-55d6465cd982" \
                }, \
                { \
                    "index": 4, \
                    "currency": "USD", \
                    "amount": "25.00", \
                    "donor_name": "Quarter_Joe", \
                    "donor_comment": "💖💖💖", \
                    "created": "2024-02-03 17:09:29", \
                    "guid": "87640226-5f9c-4d20-828e-e0f773ad899d" \
                }, \
                { \
                    "index": 5, \
                    "currency": "USD", \
                    "amount": "100.00", \
                    "donor_name": "Anonymous", \
                    "donor_comment": "", \
                    "created": "2024-02-03 17:09:14", \
                    "guid": "06778107-3216-456d-a63e-79828d828a29" \
                }, \
                { \
                    "index": 6, \
                    "currency": "USD", \
                    "amount": "10.00", \
                    "donor_name": "DapperJoe", \
                    "donor_comment": "", \
                    "created": "2024-02-03 17:03:43", \
                    "guid": "fc7256c4-244b-4ce0-98a7-cd9b525ac884" \
                }, \
                { \
                    "index": 7, \
                    "currency": "USD", \
                    "amount": "6.00", \
                    "donor_name": "Sixy_Joe", \
                    "donor_comment": "This event is amazing!", \
                    "created": "2024-01-17 21:29:48", \
                    "guid": "60e5b714-25e5-4e2e-9631-c6ece1d40a6e" \
                }, \
                { \
                    "index": 8, \
                    "currency": "USD", \
                    "amount": "1.00", \
                    "donor_name": "Anonymous", \
                    "donor_comment": "yo", \
                    "created": "2024-01-10 10:18:14", \
                    "guid": "f8b272dd-ff00-446c-aabe-7b5d0be22827" \
                } \
            ] \
        }');

    await new Promise(resolve => setTimeout(resolve, 2000));
    UpdateDonations(data1["data"]);
    await new Promise(resolve => setTimeout(resolve, 5000));
    UpdateDonations(data2["data"]);
    await new Promise(resolve => setTimeout(resolve, 69000));
    $("#donationPanels").empty();
    TestDonations();
}