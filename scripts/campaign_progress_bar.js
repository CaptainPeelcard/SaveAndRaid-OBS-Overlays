let milestoneNotificationPlayed = false;
let milestone = 0;
let lastMilestone = 0;
let raised = 0;
setInterval(async () => {milestone = await milestones.GetNextMilestoneAmount(raised)}, 1000);

    // Subscribe to campaign progress
async function SubscribeCampaignProgress(lastMessage="") {
    let response = await fetch(`${campaignUrl}?key=${apiKey}`);

    if (response.status === 502) {
            // Status 502 is a connection timeout error.
        await SubscribeCampaignProgress();
    } else if (response.status !== 200) {
            // An error, send it to the console.
        console.log(response.statusText);
            // Reconnect in one second.
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SubscribeCampaignProgress();
    } else {
            // Get and show the message.
        let message = await response.text();

        if (message !== lastMessage || lastMilestone !== milestone) {
            let campaignData = JSON.parse(message)["data"][0];
            let goal = parseFloat(campaignData["goal"].replace(/,/g,"").replace(/\.0$/,""));
            raised = parseFloat(campaignData["amount_raised"].replace(/,/g,"").replace(/\.0$/,""));
            milestone = await milestones.GetNextMilestoneAmount(raised);
            await UpdateProgressBar(raised, milestone, goal);
        }

            // Subscribe again to get the next message.
        await setTimeout(() => {SubscribeCampaignProgress(message)}, 1000);
    }
}

    // Load current campaign and milestone progress into the page.
async function UpdateProgressBar(raisedAmount, milestoneAmount, goalAmount) {
    let raisedPercent = Math.ceil(raisedAmount / goalAmount * 100);
    let milestonePercent = milestoneAmount === 0
        ? 100
        : Math.ceil(raisedAmount / milestoneAmount * 100);

    if (audioEnabled === true && raisedAmount >= lastMilestone && milestoneNotificationPlayed === false) {
        milestoneSound.play();
        milestoneNotificationPlayed = true;
    }

    if (lastMilestone !== milestoneAmount)
        milestoneNotificationPlayed = false;

    lastMilestone = milestoneAmount;

    $(".raisedProgress").attr("style", `width: ${Math.min(raisedPercent, 100)}%`);
    $("#raisedPercent").text(raisedPercent);
    $(".milestoneProgress").attr("style", `width: ${Math.min(Math.max((milestoneAmount / goalAmount * 100 - raisedPercent), 0), 100)}%`);
    $("#milestonePercent").text(milestonePercent);

    milestoneAmount = milestoneAmount === 0
        ? "ACHIEVED"
        : "$" + milestoneAmount.toLocaleString("en", {useGrouping:true});

    $("#raisedAmount").text("$" + raisedAmount.toLocaleString("en", {useGrouping:true}));
    $("#milestoneAmount").text(milestoneAmount);
    $("#goalAmount").text("$" + goalAmount.toLocaleString("en", {useGrouping:true}));
}

    // Set layout and position of progress bar widget.
function SetProgressLayout(position="top") {
        // Define progressBar html
    let progressBars = $("<div>").addClass("progress my-2")
    .append($("<div>")
        .attr({
            role: "progressBar",
            style: "width: 0%"
        })
        .addClass("raisedProgress progress-bar")
        .append("<span>GOAL <span id='raisedPercent'>0</span>%</span>")
    )
    .append($("<div>")
        .attr({
            role: "progressBar",
            style: "width: 0%"
        })
        .addClass("milestoneProgress progress-bar progress-bar-striped progress-bar-animated")
        .append("<span>MILESTONE <span id='milestonePercent'>0</span>%</span>")
    );

        // Set widget position and insert progress bar.
    if (position === "top") {
        $("#progressBar").addClass("mb-auto d-block w-100");
        $("#campaignInfo").prepend(progressBars);
    }
    if (position === "bottom") {
        $("#progressBar").addClass("mt-auto d-block w-100");
        $("#campaignInfo").append(progressBars);
    }
}

async function TestProgressBar() {
    await UpdateProgressBar(69, 5000, 10000);
    await new Promise(resolve => setTimeout(resolve, 6900));
    await UpdateProgressBar(1500, 5000, 10000);
    await new Promise(resolve => setTimeout(resolve, 6900));
    await UpdateProgressBar(6900, 7500, 10000);
    await new Promise(resolve => setTimeout(resolve, 6900));
    await UpdateProgressBar(12000, 15000, 10000);
    await new Promise(resolve => setTimeout(resolve, 6900));
    await UpdateProgressBar(15000, 0, 20000);
    await new Promise(resolve => setTimeout(resolve, 6900));
    TestProgressBar();
}