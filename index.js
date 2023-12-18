import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import session from 'express-session'
import { randomBytes } from 'crypto';

//custom dependencies
import * as database from './server/database.js';
import * as spotify from './server/spotify.js';
import './server/processes.js';

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
        database.add_user(user, access_token, refresh_token);

        // save user credintials to session for use by client
        req.session.access_token = access_token;
        req.session.user_id = user.id;
        req.session.user_displayname = user.display_name;

        // Redirect to the user's dashboard page
        res.redirect(`/dashboard/${user.id}`);

    } catch (error) {
        console.error('Error in /callback:', error);
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