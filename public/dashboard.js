// Make an Ajax request to fetch the access token
fetch('/get-token')
    .then(response => response.json())
    .then(data => {
        const { token, user_id, user_displayname } = data;
        console.log(data);
        //requestInitialData(token, user_id, user_displayname);
    })
    .catch(error => console.error('Error fetching access token:', error));

async function requestInitialData(access_token, user_id) {
    const profile = await fetchProfile(access_token);
    console.log(profile);
    const currently_playing = await fetchPlaybackState(access_token);
    console.log(currently_playing);
}