// Environment
        // Play sounds if enabled, once user has interacted with page, or browser type is OBS.
    let audioEnabled;

    $(document).on("click keydown focus touchstart", () => {
        audioEnabled = sounds;
        $(document).prop("onclick onkeydown onfocus ontouchstart", null).off("click keydown focus touchstart");
    });

// Page/widget settings
        // Set this to true in page script if this widget should resize itself to the window dimensions when it loads data the first time.
    let fitToWindow = false;

// Fetch Configurations and Defaults
        // API settings.
    let apiKey;
    let campaignUrl;
    let donationsUrl;
    let leaderboardUrl;
    let milestonesUrl;
    let participantUrl;
    let scheduleUrl;
        // User/Choice settings.
    let settings;
    let soundPlayInterval;
    let theme = GetQueryParam("theme");
    let mode = GetQueryParam("mode");
    let position = GetQueryParam("position");
    let sounds = GetQueryParam("sounds");
    let transparency = GetQueryParam("transparent");
    let animations = GetQueryParam("animations");
    let isTest = GetQueryParam("test");

    let donationSound;
    let milestoneSound;

    async function LoadSettings() {
        let response = await fetch("../settings.json");
        let json = await response.text();
        settings = JSON.parse(json);
        apiKey = settings.api.apiKey;
        campaignUrl = settings.api.endpoints.find(({ name }) => name === "campaign_events").url;
        donationsUrl = settings.api.endpoints.find(({ name }) => name === "donations").url;
        leaderboardUrl = settings.api.endpoints.find(({ name }) => name === "donation_leaderboard").url;
        milestonesUrl = settings.api.endpoints.find(({ name }) => name === "milestones").url;
        participantUrl = settings.api.endpoints.find(({ name }) => name === "participants").url;
        scheduleUrl = settings.api.endpoints.find(({ name }) => name === "schedule").url;
        
            // Theme choice.
        theme = !theme || !theme.trim()
            ? settings.defaults.theme
            : theme;

            // Load theme and/or default sound urls. for alerts.
        let donationSoundUrl = settings.alertSounds.find(({ year }) => year === "*").alerts.find(({ alertType }) => alertType === "donation").url;
        let milestoneSoundUrl = settings.alertSounds.find(({ year }) => year === "*").alerts.find(({ alertType }) => alertType === "milestone").url;

        let currentYearSounds = settings.alertSounds.find(({ year }) => year === theme);

        if (currentYearSounds !== undefined) {
            donationSoundUrl = currentYearSounds.alerts.find(({ alertType }) => alertType === "donation") !== undefined
                ? currentYearSounds.alerts.find(({ alertType }) => alertType === "donation").url
                : donationSoundUrl;

            milestoneSoundUrl = currentYearSounds.alerts.find(({ alertType }) => alertType === "milestone") !== undefined
                ? currentYearSounds.alerts.find(({ alertType }) => alertType === "milestone").url
                : milestoneSoundUrl;
        }

        donationSound = new Audio(donationSoundUrl);
        milestoneSound = new Audio(milestoneSoundUrl);

        soundPlayInterval = settings.defaults.soundPlayInterval;

            // Mode choice: alerts or history list
        mode = !mode || !mode.trim()
            ? settings.defaults.mode
            : mode;

            // Get position choice.
        position = !position || !position.trim()
            ? settings.defaults.position
            : (() => {
                switch (position.toLowerCase()) {
                    case "top":
                        return position;
                        break;
                    case "bottom":
                        return position;
                        break;
                    case "left":
                        return position;
                        break;
                    case "right":
                        return position;
                        break;
                    default:
                        return "top";
                        break;
                }
            })();

            // Get choice to play sounds. Default is enabled. Pull from local stroage if exists. Only set to local storage from toggle switch on dashboard.
        sounds = !sounds || !sounds.trim()
            ? localStorage.getItem("sounds")
            : sounds.toLowerCase() === "true";
            
        sounds = !sounds || !sounds.toString().trim()     
            ? settings.defaults.sounds
            : sounds.toLowerCase() === "true";
            
            //TODO only override from dashboard, issue getting from local storage here and comparing with URL parameter.
            // Get user choice to enable or disable animations. Default is enabled. Pull from local storage if exists. Only set to local storage from toggle switch on dashboard.
        animations = !animations || !animations.trim()
            ? settings.def
            : animations.toLowerCase() === "true";
            
            // Get transparency choice for background. Default is enabled.
        transparency = !transparency || !transparency.trim()
            ? settings.defaults.transparency
            : transparency.toLowerCase() === "true";
            
            // Start test or get real data? Default is false.
            isTest = !isTest || !isTest.trim()
            ? settings.defaults.test
            : isTest.toLowerCase() === "true";

        audioEnabled = navigator.userAgent.indexOf("OBS") >= 0
            ? sounds
            : false;      
    }