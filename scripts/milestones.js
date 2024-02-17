const milestones = (() => {
    let currentMilestones = "";
    let subscribed = false;

    async function SubscribeMilestones(lastMessage = "") {
        let response = await fetch(`${milestonesUrl}?key=${apiKey}`);

        if (response.status === 502) {
                // Status 502 is a connection timeout error.
            await SubscribeMilestones();
        } else if (response.status !== 200) {
                // An error, send it to the console.
            console.log(response.statusText);
                // Reconnect in one second.
            await new Promise(resolve => setTimeout(resolve, 1000));
            await SubscribeMilestones();
        } else {
                // Get and show the message.
            let message = await response.text();

            if (message !== lastMessage) {
                currentMilestones = JSON.parse(message)["data"];
            }

                // Subscribe again to get the next message.
            setTimeout(() => {SubscribeMilestones(message)}, 300000);
        }
    }
    return {
        GetMilestones: async () => {
            if (currentMilestones === "")
                await SubscribeMilestones()
            
            return currentMilestones;
        },
        GetNextMilestoneAmount: async (currentAmount) => {
            if (currentMilestones === "")
                await SubscribeMilestones()

            let nextMilestone = currentMilestones.find(({ achievement }) => parseFloat(achievement.replace(/,/g,"").replace(/\.0$/,"")) > currentAmount);

            if (nextMilestone === undefined)
                return 0;
            else
                return parseFloat(nextMilestone["achievement"].replace(/,/g,"").replace(/\.0$/, ""));
        }
    }
})();