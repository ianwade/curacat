//API Call Variables
const limit = 50; // Number of items returned per call (0 - 50)
const retry_delay_factor = 5; // If error 429 happens, the suggested wait time (sec) will be multiplied by this much
const retry_delay = 30; // If error 429 happens AND there is no suggested wait time, API will wait this long
const max_retry_count = 100; //Number of times API will attempt to be called before error

async function callSpotifyAPI(request, token) {
    
    let retry_count = 0;

    //continue trying to make call to API until max number of call retries is reached
    while (retry_count < max_retry_count) {
        try {

            // make call to API
            const response = await fetch(request, {
                method: "GET", headers: { Authorization: `Bearer ${token}` }
            });

            // successful API call. return the response
            if (response.status === 200) {
                return await response.json();
            }
            // If the API returns a rate limit error (status code 429), you may want to wait and retry
            else if (response.status === 429) {
                let retryAfter = retry_count; response.headers['retry-after']; // Get the suggested retry time. Double it, can't be too sure. Default is 10 seconds. 
                
                if(retryAfter == 1)
                    retryAfter = retry_delay;
                else
                    retryAfter *= retry_delay_factor;

                await sleep(retryAfter / 10); // Sleep for the suggested time
            }
            else {
                // Handle other error codes as needed
                throw new Error(`API request failed with status code: ${response.status}`);
            }
        }
        catch (error) {
            console.error("API request failed with status code: " + response.status);
        }

        retry_count++;
        retries_total++;
        document.getElementById("retries").innerText = retries_total;
    }

    return [];
}

//Helper function to create a delay when needed for api calls
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Makes calls to Spotify API and returns data or errors accordingly
//Takes: spotify API & spotify oauth token
//Returns: response from API in a JSON format
async function fetchDataFromSpotify(urls, token) {

    //create thread/process for each API call 
    const promises = urls.map(async (request) => {
        return callSpotifyAPI(request, token);
    });
    
    // bundles responses from each api call into one dictionary
    const results = await Promise.all(promises);

    retries_total = 0;

    return results;
}

async function fetchPlaylistTracks(token, id, offset) {

    const result = await fetch('https://api.spotify.com/v1/playlists/'+id+'/tracks?limit=50&offset=' + offset, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchSavedTracks(token, offset) {

    const result = await fetch("https://api.spotify.com/v1/me/tracks?limit=50&offset=" + offset, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchProfile(token) {

    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchTopItems(token, offset) {

    const result = await fetch("https://api.spotify.com/v1/me/top/artists?time_range="+term+"&limit="+limit+"&offset="+offset, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchPlaybackState(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    //track is not playing
    if(result.status === 204)
        return {};    
    
    return await result.json();
}

async function fetchArtistsAlbums(token, id, offset) {

    const result = await fetch("https://api.spotify.com/v1/artists/" + id + "/albums?include_groups=album&market=ES&limit=50&offset=" + offset, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}