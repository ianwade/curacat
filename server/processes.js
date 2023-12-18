/* CONTINUOUS FUNCTIONS FOR FETCHING USER PLAYBACK */

//implement a way to stop collection of playback on the fly

const playback_interval = 30; // interval between playback state fetches in seconds
const playback_progress = 0.1; // required percentage of track that has to be played before it's stored in db (helps with duplicates)

const user_list = await database.retrieve_users();

collect_all_users_playback(user_list, playback_interval * 1000, playback_progress);

// continuously fetches each user's current playback state at a set interval
async function collect_all_users_playback(users, interval, progress) {

    for(const user of users) {
      setInterval(async () => {
          await user_playback(user, progress);
      }, interval);
    }
}

// fetches this current user's playback; returns a spotify track object
// if access token expires, this will request a new one
async function user_playback(user, progress) {

    try {
        let track = await spotify.fetchPlaybackState(user.access_token);

        if(track.error && track.error.status === 401) {
          let new_token = await refresh_access_token(user);
          user.access_token = new_token;
          track = await spotify.fetchPlaybackState(new_token);
        }

        if (track.is_playing && track != {})
            await database.add_track(user, track);
    
        return track;

    } catch(err) {

        console.error('Error fetching playback for user: ' + err);
        throw err;
    }
}

// fetches new access token for user
async function refresh_access_token(user) {
    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            `grant_type=refresh_token&refresh_token=${user.refresh_token}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
                }
            }
        );

        if(response.status === 200) {
            console.log("successful token refresh for " + user.username);
            database.update_token(user, response.data.access_token);
            return response.data.access_token;
        }

        return response.data.access_token;

    } catch (error) {
        console.error('Error refreshing access token');
        throw error;
    }
}
