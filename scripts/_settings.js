// Environment
        // Play sounds if enabled, once user has interacted with page, or browser type is OBS.
    let audioEnabled;

    $(document).on("click keydown focus touchstart", () => {
        audioEnabled = sounds;
        $(document).prop("onclick onkeydown onfocus ontouchstart", null).off("click keydown focus touchstart");
    });

// Page/widget settings
        // Controls how widget sizing and data is loaded.
    let isDashboard = false;
        // Sync animation interval;
    let animationInterval;

// Fetch Configurations and Defaults
        // API settings.
    let apiKey;
    let campaignUrl;
    let donationsUrl;
    let leaderboardUrl;
    let milestonesUrl;
    let participantUrl;
    let scheduleUrl;
    let streamInfoUrl;
        // User/Choice settings.
    let settings;
    let soundPlayInterval;
    let theme = GetQueryParam("theme");
    let mode = GetQueryParam("mode");
    let position = GetQueryParam("position");
    let sounds = GetQueryParam("sounds");
    let transparency = GetQueryParam("transparent");
    let transparencyLevel = GetQueryParam("transparencyLevel");
    let animations = GetQueryParam("animations");
    let isTest = GetQueryParam("test");

    let donationSound;
    let milestoneSound;

    async function LoadSettings() {
        let response = await fetch("../settings.json");
        let json = await response.text();
        settings = await JSON.parse(json);
        apiKey = settings.api.apiKey;
        campaignUrl = settings.api.endpoints.find(({ name }) => name === "campaign_events").url;
        donationsUrl = settings.api.endpoints.find(({ name }) => name === "donations").url;
        leaderboardUrl = settings.api.endpoints.find(({ name }) => name === "donation_leaderboard").url;
        milestonesUrl = settings.api.endpoints.find(({ name }) => name === "milestones").url;
        participantUrl = settings.api.endpoints.find(({ name }) => name === "participants").url;
        scheduleUrl = settings.api.endpoints.find(({ name }) => name === "schedule").url;
        streamInfoUrl = settings.api.endpoints.find(({ name }) => name === "get_stream").url;
        
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

            // Get choice to play sounds. Default is enabled.
        sounds = !sounds || !sounds.trim()
            ? settings.defaults.sounds
            : sounds.toLowerCase() === "true";
            
            // Get user choice to enable or disable animations. Default is enabled.
        animations = !animations || !animations.trim()
            ? settings.defaults.animations
            : animations.toLowerCase() === "true";

        animationInterval = animations === true
            ? 1000
            : 0;
            
            // Get transparency choice for background. Default is enabled.
        transparency = !transparency || !transparency.trim()
            ? settings.defaults.transparency
            : transparency.toLowerCase() === "true";

            // Get transparency level choice for background. Default is low.
        transparencyLevel = !transparencyLevel || !transparencyLevel.trim()
            ? settings.defaults.transparencyLevel
            : transparencyLevel;
            
            // Start test or get real data? Default is false.
        isTest = !isTest || !isTest.trim()
            ? settings.defaults.test
            : isTest.toLowerCase() === "true";

        audioEnabled = navigator.userAgent.indexOf("OBS") >= 0
            ? sounds
            : false;
    }

        // Apply user style choices.
    function SetTheme() {
        let dataTheme = theme;
        if (transparency === true) {
    
                // We do this to avoid a user selecting an invalid transparency level in applying theme.
            switch (transparencyLevel) {
                case "low":
                    dataTheme = `${dataTheme} transparent`
                    break;
                case "medium":
                    dataTheme = `${dataTheme} transparent-${transparencyLevel}`
                    break;
                case "high":
                    dataTheme = `${dataTheme} transparent-${transparencyLevel}`
                    break;
                case "full":
                    dataTheme = `${dataTheme} transparent-${transparencyLevel}`
                    break;
                default:
                    dataTheme = `${dataTheme} transparent`
                    break;
            }
        }
    
        if (animations === false)
            dataTheme = `${dataTheme} no-animate`;
    
            document.documentElement.setAttribute("data-theme", dataTheme);
    }

    async function StoreSetting(setting) {
        eval(`${setting.name} = setting.checked`);

        if (setting.name === "sounds") {
            audioEnabled = setting.checked;
        } else {
            localStorage.setItem(setting.name, setting.checked);
            SetTheme();
        }
    }