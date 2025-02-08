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

        // Clear all panels if information has been removed or changed.
    if (mode === "history" && donations.length <= donationPanels.length && donationPanels.length > 0) {
        for (let panel of donationPanels) {
            $(panel).addClass("zoomOut").removeClass("zoomIn");
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        $("#donationPanels").empty();
    }

        // Process information for all donations. Update info in history mode and queue new alerts in alert mode.
    for (let i = 0; i < donations.length; i++) {
        let donation = donations[i];
            // Define new panel html.
        let newPanel = $("<div class='infoPanel row overflow-hidden justify-content-center align-items-center my-1 animated zoomIn'>")
            .attr("id", donation.guid)
            .css({
                "height": "var(--infoPanel-alert-height)",
                "width": "100%",
                "background": GetRandomGradient('var(--infoPanel-background-color)', 'var(--infoPanel-gradient-color)')
            })
            .append($("<div class='donationTotal d-flex justify-content-center align-items-center'>")
                .text( "$" + parseFloat(donation.amount.replace(/,/g,"").replace(/\.0$/,"")).toLocaleString("en", {useGrouping:true}) ))
            .append($("<div class='donationName d-flex justify-content-center align-items-center text-truncate text-uppercase'>")
                .text(UnEscape(donation.donor_name)))
            .append($("<figure class='donationText text-end my-1'>")
                .append($("<blockquote class='blockquote text-truncate text-uppercase'>")
                    .append($("<span class='donationTotal'>").text( "$" + parseFloat(donation.amount.replace(/,/g,"").replace(/\.0$/, "")).toLocaleString("en", {useGrouping:true}) ))
                    .append($("<span class='divider'>").text("   --   "))
                    .append($("<span class='donationName'>").text(UnEscape(donation.donor_name))))
                .append($("<figcaption class='donationMessage blockquote-footer text-truncate text-uppercase'>")
                    .text(UnEscape(donation.donor_comment))
                    .css("display", donation.donor_comment === "" ? "none" : "block")));

            // Insert, show and scroll to the new panel.
        if (mode === "history") {
            $("#donationPanels").prepend(newPanel);

                // Resize widget when loading data the first time, fitToWindow must be set to true in page script.
            if (fitToWindow === true && alertDimensionsAdjusted === false) {
                donationPanelQuantity = await ResizeDonations();
                if (donationPanelQuantity > 0)
                    alertDimensionsAdjusted = true;
            }

            $(`#${donation.guid}`).css("display", "flex");
            let scrollPanel = document.getElementById(donation["guid"]);
            scrollPanel.scrollIntoView(1);
        }

        if (mode === "alerts") {
            alerts.QueueAlert(async () => {
                donationPanels = $("#donationPanels").children("div");
                while (donationPanels.length >= donationPanelQuantity && alertDimensionsAdjusted === true) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    donationPanels = $("#donationPanels").children("div");
                }

                $("#donationPanels").prepend(newPanel);

                    // Resize widget when loading data the first time, fitToWindow must be set to true in page script.
                if (fitToWindow === true && alertDimensionsAdjusted === false) {
                    donationPanelQuantity = await ResizeDonations();
                    if (donationPanelQuantity > 0)
                        alertDimensionsAdjusted = true;
                }

                    // Show the panel if it will fit. Delay it to line up with the entracne of updated panel animations.
                $(`#${donation.guid}`).css("display", "flex");

                let donationSoundLastPlayed = localStorage.getItem("donationSoundLastPlayed");
                donationSoundLastPlayed = donationSoundLastPlayed === null
                    ? 0
                    : parseInt(donationSoundLastPlayed, 10);
    
                    // Play sound if sound is enabled, the below conversion of autoPlay to string is a wienrd bug that only happens in OBS. Other browsers see this globally as a bool as expected.            
                if (audioEnabled === true && donationSoundLastPlayed + soundPlayInterval <= Date.now()) {
                    donationSound.play();
                    donationSoundLastPlayed = Date.now();
                    localStorage.setItem("donationSoundLastPlayed", donationSoundLastPlayed);
                }

                setTimeout(() => {
                    if (animations === true) {

                            // Fade out child text elements
                        $(`#${donation.guid}`).children().each((index, childData) => {
                            $(childData).css({
                                "transition": "opacity 500ms ease-in-out",
                                "opacity": 0
                            });
                        });

                        $(`#${donation.guid}`).css({
                            "overflow": "hidden",
                            "transition": "width 1000ms 0ms ease-in-out, border-radius 500ms 600ms ease-in-out",
                            "width": "var(--infoPanel-alert-height)",
                            "border-radius": "50%"
                        });

                        setTimeout(() => {
                            $(`#${donation.guid}`).empty();

                            $(`#${donation.guid}`).append(
                                $("<div class='alert-exit'>")
                                .css({
                                    "background": "var(--infoPanel-background-color)",
                                    "height": "100%",
                                    "width": "100%",
                                    "border-radius": "50%",
                                    "opacity": 0
                                })
                            );
                            $(`#${donation.guid} > .alert-exit`).css({
                                "opacity": 1,
                                "transition": "opacity 300ms linear"
                            });
                        }, 1100);

                        setTimeout(() => {
                            $(`#${donation.guid}`).css({
                                "background-color": "rgba(255,255,255,0)",
                                "background-image": "var(--theme-alert-image)",
                                "background-repeat": "no-repeat",
                                "background-size": "contain",
                                "background-position": "center",
                                "background-origin": "content-box",
                                "padding": "10px"
                            });
                            
                            $(`#${donation.guid} > .alert-exit`).css({
                                "opacity": 0,
                                "transition": "opacity 500ms linear",
                            });
                        }, 1300);
                        
                        setTimeout(() =>{
                            $(`#${donation.guid}`).addClass("zoomOut").removeClass("zoomIn");
                        }, 1700);
                    }

                    setTimeout(() => {
                        $(`#${donation.guid}`).remove();
                    }, 2500);
                }, 5000);
            });
        }
    };
    // Last step - scroll to top - only applies to dashboard page and its elements
    autoScrollToTop('#donationsDashboardContainer', 0, 250);
    autoScrollToTop('#leaderboardDashboardContainer', 0, 250);
}

    // Set border size to fit maximum number of panels that will can be shown, and the max number of panels.
async function ResizeDonations() {
    let panels = $("#donationPanels").children("div");
    let maxPanels = 0;
    
    if (panels.length > 0) {
        let bodyPadding = parseFloat($("body").css("padding-top").replace(/px/i, ""))
            + parseFloat($("body").css("padding-bottom").replace(/px/i, ""));
        let containerWhitespace = parseFloat( $("#donations > div").css("margin-top").replace(/px/i, ""))
            + parseFloat($("#donations > div").css("margin-bottom").replace(/px/i, ""))
            + parseFloat($("#donations > div").css("padding-top").replace(/px/i, ""))
            + parseFloat($("#donations > div").css("padding-bottom").replace(/px/i, ""));
        let titlePanelHeight = mode === "alerts"
            ? 0
            : parseFloat($("#donationsTitle").css("margin-top").replace(/px/i, ""))
                + parseFloat($("#donationsTitle").css("margin-bottom").replace(/px/i, ""))
                + parseFloat($("#donationsTitle").css("height").replace(/px/i, ""));

        let panel = $(panels[0]);
            // TODO find where extra padding/margin is coming from for dynamic calculation. 4px has been added for now.
        let panelHeight = 4 + parseFloat(panel.css("height").replace(/px/i, ""))
        let panelMarginTop = parseFloat(panel.css("margin-top").replace(/px/i, ""));
        let panelMarginBottom = parseFloat(panel.css("margin-bottom").replace(/px/i, ""));
        panelHeight = panelMarginTop > panelMarginBottom
            ? panelHeight + panelMarginTop
            : panelHeight + panelMarginBottom;

        let panelAreaHeight = $(window).innerHeight() - bodyPadding - containerWhitespace - titlePanelHeight - panelMarginBottom - panelMarginTop;

        maxPanels = Math.floor(panelAreaHeight / panelHeight);

        //if (mode === "history")
            panels.each((index, hiddenPanel) => {
                if ((mode === "history" && index + 1 > maxPanels - panels.length) || (mode === "alerts" && index + 1 <= maxPanels)) {
                    $(hiddenPanel).css("display", "flex");
                    hiddenPanel.scrollIntoView(1);
                }
                else {
                    $(hiddenPanel).css("display", "none");
                }
            });
    
        let borderHeight = panelHeight * maxPanels + panelMarginBottom * 2;
        $("#donationsContainer").css("height", `${borderHeight}px`);
    }

    return maxPanels;
}

async function TestDonations() {
    const data1 = JSON.parse(
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
        }');

    const data2 = JSON.parse(
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

    const data3 = JSON.parse(
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
    if (mode === "alerts") {
        UpdateDonations(data1["data"]);
        await new Promise(resolve => setTimeout(resolve, 5000));
        UpdateDonations(data2["data"]);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    UpdateDonations(data3["data"]);
    await new Promise(resolve => setTimeout(resolve, 25000));
    $("#donationPanels").empty();
    TestDonations();
}

function autoScrollToTop(containerId, timeOut, speed) {
    setTimeout(function() {
        $(containerId).animate({ scrollTop: 0 }, speed);
    }, timeOut); // 1000ms delay before running the animation
};
    