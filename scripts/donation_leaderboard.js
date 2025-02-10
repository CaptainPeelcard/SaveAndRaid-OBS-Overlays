let leaderPanelQuantity = 0;
let leaderboardDimensionsAdjusted = false;

    // Subscribe to leaderboard API and refresh every 5 seconds. Update the leaderboard if there is new info.
async function SubscribeLeaderboard(lastMessage = "") {
    let response = await fetch(`${leaderboardUrl}?key=${apiKey}`);

    if (response.status === 502) {
            // Status 502 is a connection timeout error.
        await SubscribeLeaderboard();
    } else if (response.status !== 200) {
            // An error, send it to the console.
        console.log(response.statusText);
            // Reconnect in one second.
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SubscribeLeaderboard();
    } else {
            // Get and show the message.
        let message = await response.text();

        if (message !== lastMessage)
            await UpdateLeaderBoard(JSON.parse(message)["data"]);

            // Subscribe again to get the next message.
        await setTimeout(() => {SubscribeLeaderboard(message)}, 5000);
    }
}

    // Update leaderboard with JSON array containing donor name and toaol.
async function UpdateLeaderBoard(donators) {
    let leaderPanels = $("#leaderPanels").children("div");
    donators.forEach((donator, index) => {
            // Create a new panel if we don't have enough.
        if (index + 1 > leaderPanels.length) {
            $("#leaderPanels").append($("<div>")
                .addClass("infoPanel row my-1 w-100 align-items-center animated zoomIn")
                .css("background", GetRandomGradient('var(--infoPanel-background-color)', 'var(--infoPanel-gradient-color)'))
                .append($("<div>")
                    .addClass("donationTotal text-center fs-4")
                    .text("$" + parseFloat(donator.amount.replace(/,/g,"").replace(/\.0$/, "")).toLocaleString("en", {useGrouping:true}))
                ).append($("<div>")
                    .addClass("donationName text-center text-truncate text-uppercase fs-4")
                    .text(donator.donor_name))
            );

            leaderPanels = $("#leaderPanels").children("div");

                // Show the panel if it will fit.
            if (index + 1 <= leaderPanelQuantity || fitToWindow === false)
                $(leaderPanels[index]).css("display", "flex");
            
        } else {
                // Update information in existing panel.
            let donationTotal = leaderPanels[index].querySelector(".donationTotal");
            let donationName = leaderPanels[index].querySelector(".donationName");
            let donationTotalText = "$" + parseFloat(donator.amount.replace(/,/g,"").replace(/\.0$/, "")).toLocaleString("en", {useGrouping:true});

            if (donationTotalText !== donationTotal.innerHTML || donator.donor_name !== donationName.innerHTML) {
                $(leaderPanels[index]).addClass("zoomOut").removeClass("zoomIn");
                
                    // Reload the panel if it will fit.
                    // TODO find another way to reload CSS behavior when using add/remove class.
                if (index + 1 <= leaderPanelQuantity || fitToWindow === false)
                    $(leaderPanels[index]).css("display", "flex");

                donationTotal.innerHTML = donationTotalText;
                donationName.innerHTML = donator.donor_name;
                $(leaderPanels[index])
                    .css("background", GetRandomGradient('var(--infoPanel-background-color)', 'var(--infoPanel-gradient-color)'))
                    .addClass("zoomIn").removeClass("zoomOut");
                
                    // Reload the panel if it isn't hidden (accounting for area resize during animation.)
                if (index + 1 <= leaderPanelQuantity || fitToWindow ===  false)
                    $(leaderPanels[index]).css("display", "flex");
            }
        }
    });

        // Resize widget when loading data the first time, fitToWindow must be set to true in page script.
    if (fitToWindow === true && leaderboardDimensionsAdjusted === false) {
        leaderPanelQuantity = await ResizeLeaderboard()
        if (leaderPanelQuantity > 0)
            leaderboardDimensionsAdjusted = true;
    }
}

    // Set border size to fit maximum number of panels that will can be shown, and the max number of panels.
async function ResizeLeaderboard () {
    let panels = $("#leaderPanels").children("div");
    let panelModified = false;
    let maxPanels = 0;
    
    if (panels.length > 0) {
        let bodyPadding = parseFloat($("body").css("padding-top").replace(/px/i, ""))
            + parseFloat($("body").css("padding-bottom").replace(/px/i, ""));
        let containerWhitespace = parseFloat( $("#leaderboard > div").css("margin-top").replace(/px/i, ""))
            + parseFloat($("#leaderboard > div").css("margin-bottom").replace(/px/i, ""))
            + parseFloat($("#leaderboard > div").css("padding-top").replace(/px/i, ""))
            + parseFloat($("#leaderboard > div").css("padding-bottom").replace(/px/i, ""));
        let titlePanelHeight = parseFloat($("#leaderboardTitle").css("margin-top").replace(/px/i, ""))
            + parseFloat($("#leaderboardTitle").css("margin-bottom").replace(/px/i, ""))
            + parseFloat($("#leaderboardTitle").css("height").replace(/px/i, ""));
        
        let panel = $(panels[0]);
        if (panel.css("display") === "none") {
            panel.css({
                display: "flex",
                opacity: 0
            });

            panelModified = true;
        }

        let panelHeight = 4 + parseFloat(panel.css("height").replace(/px/i, ""))
        let panelMarginTop = parseFloat(panel.css("margin-top").replace(/px/i, ""));
        let panelMarginBottom = parseFloat(panel.css("margin-bottom").replace(/px/i, ""));
        panelHeight = panelMarginTop > panelMarginBottom
            ? panelHeight + panelMarginTop
            : panelHeight + panelMarginBottom;
        let panelAreaHeight = $(window).innerHeight() - bodyPadding - containerWhitespace - titlePanelHeight;

        if (panelModified === true)
            panel.css({
                display: "none",
                opacity: 1
            });

        maxPanels = Math.floor(panelAreaHeight / panelHeight);

        panels.each((index, hiddenPanel) => {
            if (index + 1 <= maxPanels)
                $(hiddenPanel).css("display", "flex");
            else
                $(hiddenPanel).css("display", "none");
        });

        if (maxPanels > 1)
            $("#leaderboardTitle").text("TOP DONORS");
        else
            $("#leaderboardTitle").text("TOP DONOR");

        let borderHeight = panelHeight * maxPanels + panelMarginBottom * 2;
        $("#leaderboardContainer").css("height", `${borderHeight}px`);
    }

    return maxPanels;
}

async function TestLeaderBoard() {
        // Test data.
    const data1 = JSON.parse(' \
    { \
        "data": [ \
            { \
                "index": 1, \
                "currency": "USD", \
                "amount": "0.69", \
                "donor_name": "Joe_Mama" \
            }, \
            { \
                "index": 2, \
                "currency": "USD", \
                "amount": "0.25", \
                "donor_name": "Quarter_Joe" \
            } \
        ] \
    }');
    const data2 = JSON.parse(' \
    { \
        "data": [ \
            { \
                "index": 1, \
                "currency": "USD", \
                "amount": "920.69", \
                "donor_name": "DaggerJoe" \
            }, \
            { \
                "index": 2, \
                "currency": "USD", \
                "amount": "250.0", \
                "donor_name": "Quarter_Joe" \
            }, \
            { \
                "index": 3, \
                "currency": "USD", \
                "amount": "200.0", \
                "donor_name": "200_Mile_Joe" \
            }, \
            { \
                "index": 4, \
                "currency": "USD", \
                "amount": "100.0", \
                "donor_name": "Franklin_Joe" \
            }, \
            { \
                "index": 5, \
                "currency": "USD", \
                "amount": "69.0", \
                "donor_name": "Joe_Mama" \
            }, \
            { \
                "index": 6, \
                "currency": "USD", \
                "amount": "45.0", \
                "donor_name": "PC_Joe" \
            }, \
            { \
                "index": 7, \
                "currency": "USD", \
                "amount": "42.69", \
                "donor_name": "Stoner_Joe" \
            }, \
            { \
                "index": 8, \
                "currency": "USD", \
                "amount": "36.0", \
                "donor_name": "360_NoScope_Joe" \
            }, \
            { \
                "index": 9, \
                "currency": "USD", \
                "amount": "20.0", \
                "donor_name": "Halo_Joe" \
            }, \
            { \
                "index": 10, \
                "currency": "USD", \
                "amount": "5.0", \
                "donor_name": "Five_Minute_Joe" \
            } \
        ] \
    }');
    const data3 = JSON.parse(' \
    { \
        "data": [ \
            { \
                "index": 1, \
                "currency": "USD", \
                "amount": "1000.0", \
                "donor_name": "DaggerJoe" \
            }, \
            { \
                "index": 2, \
                "currency": "USD", \
                "amount": "250.0", \
                "donor_name": "Quarter_Joe" \
            }, \
            { \
                "index": 3, \
                "currency": "USD", \
                "amount": "200.0", \
                "donor_name": "200_Mile_Joe" \
            }, \
            { \
                "index": 4, \
                "currency": "USD", \
                "amount": "100.0", \
                "donor_name": "Franklin_Joe" \
            }, \
            { \
                "index": 5, \
                "currency": "USD", \
                "amount": "69.0", \
                "donor_name": "Joe_Mama" \
            }, \
            { \
                "index": 6, \
                "currency": "USD", \
                "amount": "45.0", \
                "donor_name": "PC_Joe" \
            }, \
            { \
                "index": 7, \
                "currency": "USD", \
                "amount": "42.69", \
                "donor_name": "Stoner_Joe" \
            }, \
            { \
                "index": 8, \
                "currency": "USD", \
                "amount": "36.0", \
                "donor_name": "360_NoScope_Joe" \
            }, \
            { \
                "index": 9, \
                "currency": "USD", \
                "amount": "20.0", \
                "donor_name": "Halo_Joe" \
            }, \
            { \
                "index": 10, \
                "currency": "USD", \
                "amount": "5.0", \
                "donor_name": "Five_Minute_Joe" \
            }, \
            { \
                "index": 11, \
                "currency": "USD", \
                "amount": "40.0", \
                "donor_name": "Fourty_Man_Joe" \
            }, \
            { \
                "index": 12, \
                "currency": "USD", \
                "amount": "10.0", \
                "donor_name": "Dime_Joe" \
            } \
        ] \
    }');

    
    // Populate test data.
    await UpdateLeaderBoard(data1["data"]);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await UpdateLeaderBoard(data2["data"]);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await UpdateLeaderBoard(data3["data"]);
    await new Promise(resolve => setTimeout(resolve, 10000));
        // Empty leaderboard.
    $("#leaderPanels").empty();
    TestLeaderBoard();
}