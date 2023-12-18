// Make an Ajax request to fetch the access token
fetch('/get-token')
    .then(response => response.json())
    .then(data => {
        const { token, user_id, user_displayname } = data;
        console.log(data);
        requestInitialData(token, user_id, user_displayname);
    })
    .catch(error => console.error('Error fetching access token:', error));

async function requestInitialData(access_token, user_id, user_displayname) {
    console.log("\nrequest initial data\n");
    console.log(user_id, + " / " + user_displayname);
    //const profile = await fetchProfile(access_token);

    const currently_playing = await fetchPlaybackState(access_token);
    console.log(currently_playing);
}