    // return URL parameters.
function GetQueryParam(param) {
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}

    // Unescape HTML strings.
function UnEscape(htmlString) {
    htmlString = htmlString.replace(/&lt;/g , "<");	 
    htmlString = htmlString.replace(/&gt;/g , ">");     
    htmlString = htmlString.replace(/&quot;/g , "\"");  
    htmlString = htmlString.replace(/&#39;/g , "\'");   
    htmlString = htmlString.replace(/&amp;/g , "&");
    htmlString = htmlString.replace(/&nbsp;/g, " ");
    return htmlString;
}

    // Return a random linear gradient from two provided RGBA values.
function GetRandomGradient(fromColor, toColor) {
    let degrees = Math.floor(Math.random() * 361);
    let fromPercentStop = Math.floor(Math.random() * 101);
    return `linear-gradient(${degrees}deg, ${fromColor} ${fromPercentStop}%, ${toColor} 100%)`
}

    // Apply user style choices.
function SetTheme(overrideTransparency = false) {
    let dataTheme = theme;
    if (transparency === true || overrideTransparency === true)
        dataTheme = `${dataTheme} ${theme}-transparent`;
    if (animations === false)
        dataTheme = `${dataTheme} no-animate`;

        document.documentElement.setAttribute("data-theme", dataTheme);
}

    // Alert processing queue
const alerts = (() => {
    let queue = [];
    let isProcessing = false;

        // Add new item to queue
    async function QueueAlert(operation) {
        queue.push(async () => {
            try {
                await operation();
            } catch (error) {
                throw error;
            }
        });
        ProcessQueue();
    }

        // Continue processing the queued requests until complete.
    async function ProcessQueue() {
        if (!isProcessing && queue.length > 0) {
            isProcessing = true;

            var operation = queue.shift();
            try {
                await operation();
                isProcessing = false;
                ProcessQueue();
            } catch (error) {
                isProcessing = false;
                ProcessQueue();
            }
        }
    }

    return {
        QueueAlert
    }
})();