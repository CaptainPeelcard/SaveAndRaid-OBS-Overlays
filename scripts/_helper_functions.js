    // return URL parameters.
function GetQueryParam(param) {
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}

const pad = (n) => (n < 10 ? '0' + n : n);

function formatDate(date, timeOnly = false) {
    let formatDate = new Date(date);
    let dateString = [
        pad(formatDate.getMonth() + 1),
        pad(formatDate.getDate())
    ].join('/');

    let timeString = [
        pad(formatDate.getHours()),
        pad(formatDate.getMinutes())
    ].join(':');
    
    if (timeOnly === true)
        return timeString;

    dateString += ` ${timeString}`;
    return dateString;
};

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