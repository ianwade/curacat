import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import session from 'express-session'
import { randomBytes } from 'crypto';

//custom dependencies
import * as database from './server/database.js';
import * as spotify from './server/spotify.js';

const app = express();

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret: randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true,
}));

const scopes = ['user-library-read user-read-playback-state user-read-private user-read-email'];

/* USER AUTHENICATION & REGISTRATION FOR APP */

app.listen(process.env.PORT, () => {
    console.log(`\nServer is running on port ${process.env.PORT}\n`);
});

//Landing page
app.get('/', (req, res) => {
    res.render('index');
});

//Spotify authorization
app.get('/login', (req, res) => {
    res.redirect(
        'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.CLIENT_ID,
            scope: scopes.join(' '),
            redirect_uri: process.env.REDIRECT_URI,
        })
    );
});

//Spotify authorization callback
app.get('/callback', async (req, res) => {
    try {
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({
                grant_type: 'authorization_code',
                code: req.query.code, // Assuming 'code' is in the query parameters
                redirect_uri: process.env.REDIRECT_URI,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`,
                },
            }
        );

        // save user's access and refresh tokens
        const access_token = tokenResponse.data.access_token;
        const refresh_token = tokenResponse.data.refresh_token;

        // get user's profile and add to database (if not already present)
        const user = await spotify.fetchProfile(access_token);
        await database.add_user(user, access_token, refresh_token);

        // save user credintials to session for use by front-end
        req.session.access_token = access_token;
        req.session.user_id = user.id;
        req.session.user_displayname = user.display_name;

        // Redirect to the user's dashboard page
        res.redirect(`/dashboard/${user.id}`);

    } catch (error) {
        console.error('Error in /callback:', error);
        // Handle errors appropriately
        res.status(500).send('Internal Server Error');
    }
});

//User dashboard
app.get('/dashboard/:user_id', async (req, res) => {
    res.render('dashboard');
});

//AJAX request for user info/token
app.get('/get-token', async (req, res) => {
    const token = req.session.access_token;
    const user_id = req.session.user_id;
    const user_displayname = req.session.user_displayname;

    res.json({ token, user_id, user_displayname });
});

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

// fetches this current user's playback; returns a spotify track object
// if access token expires, this will request a new one
async function user_playback(user, progress) {

  const max_retries = 10;
  let retries = 0;

    try {
        let track = await spotify.fetchPlaybackState(user.access_token);

        if(track.error && track.error.status === 401) {
          let new_token = await refresh_access_token(user);
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