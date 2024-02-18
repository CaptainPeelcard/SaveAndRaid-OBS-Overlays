# SAVE AND RAID OBS OVERLAYS
## About
### What is this?
These are a set of OBS Browser Source Overlays that are used for the official Save and Raid annual charity event! They show current progress to total raised toward raising funds for SAVE.org.

### What is Save and Raid?
Save&Raid (S&R) is a multi-streamer relay marathon where our community of streamers, over the course of a weekend, works in turns to complete a game series by playing for one hour each, then passing along the save files and viewers to the next streamer in the list, through the use of Twitch raids. We raise money for suicide prevention each year through Suicide Awareness Voices of Education (SAVE).

You can find more information and news at https://saveandraid.org/

## Documentation
### Setup and Install
**Overlay Pages:**
  - **Campaign Progress Bar:**
    - URL: https://alerts.saveandraid.org/campaign_progress_bar.html
    - URL Parameters: position, transparent, test, theme
  - **Donation Alerts:**
    - URL: https://alerts.saveandraid.org/donation_alerts.html
    - URL Parameters: transparent, test, theme
  - **Donation Leaderboard:**
    - URL: https://alerts.saveandraid.org/donation_leaderboard.html
    - URL Parameters: mode, sounds, transparent, test, theme
 
**Adding Overlays To OBS Scenes**
  1. Copy the desired URL for the wideet you want to add from the links above.
  2. In the scene you want to add your widget to, click the + button and select "Browser Source"
     - Name your source
     - Put address the URL field.
     - Enter the width and height you want for the widget in the Browser Source Settings box. Do not use Transform Source to change the size. The widgte will size itself for you.
     - If you are adding the alert widget, be sure to check "Control Audio via OBS" to balance the noise level.
     - Click ok and place the widget where you want.

### Options
  - position:
      - Description: This sets the widget position to the top or bottom of the browser window.
      - Values: "top", "bottom" (Default is top if not specified).
  - sounds:
      - Description: Enables or disables playback of sounds. OBS should play these automatically if enabled, you will need to interact with the page in other browsers.
      - Values: "true", "false" (Default is true if not specified).
      - Recommended: If using a widget that plays sounds, in the Browser Source Settings window, check "Control Audio via OBS" so you can change how loud the sounds will play.
        
        ![image](https://github.com/CaptainPeelcard/SaveAndRaid-OBS-Overlays/assets/134344260/cc16e9d2-95ff-4b75-81df-4097a4710b32)
  - transparency: 
      - Description: Enables or disables the alpha transparency on the black title panels and progress bar background.
      - Values: "true", "false" (Default is true if not specified).
  - mode:
      - Description: This applies to the alert widget. Runs the widget in history or alert mode. Alert mode will display a sound and animation for newly received donations, while history will show recent donations and update them as they change.
      - Values: "alerts", "history" (Default is alerts if not specified).
  - test
      - Description: Runs widget in test mode or with live data.
      - Values: "true", "false" (Default is false if not specified).
  - theme
      - Description: This sets the style/theme created specially for each year's event. This is automatically specified in the defaults for each year and does not need to be specified.
      - Values: {{year}}

### Examples
1. Campaign Progress Bar:
   - Example of progress bar at top, no parameters given:
     
       URL: https://alerts.saveandraid.org/campaign_progress_bar.html
     
       <img src="https://github.com/CaptainPeelcard/SaveAndRaid-OBS-Overlays/assets/134344260/3f7b1ece-cc1a-4203-b1e5-1f85f3af82a4" width="300">
     
   - Example of progress bar at bottom, position parameter given:

      URL: https://alerts.saveandraid.org/campaign_progress_bar.html?position=bottom
     
      <img src="https://github.com/CaptainPeelcard/SaveAndRaid-OBS-Overlays/assets/134344260/e9bece5d-ae3e-4977-ad20-a3ecd693d11d" width="300">

2. Donation LeaderBoard:
    - Example of leaderboard with transparency and animations disabled:

        URL: https://alerts.saveandraid.org/donation_leaderboard.html?transparent=false&animations=false

      <img src="https://github.com/CaptainPeelcard/SaveAndRaid-OBS-Overlays/assets/134344260/7bb40037-8e62-40db-956b-da4d34356d4f" width="300">


3. Example of widget layout in OBS with gameplay scene

     <img src="https://github.com/CaptainPeelcard/SaveAndRaid-OBS-Overlays/assets/134344260/c2fac7a5-feec-48a8-ba6e-a785a1cbaf2f" width="300">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="https://github.com/CaptainPeelcard/SaveAndRaid-OBS-Overlays/assets/134344260/d0b2d059-19c6-4109-b70d-32808c1e8c4f" width="300">


     
