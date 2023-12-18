// Because this is a literal single page application
// we detect a callback from Spotify by checking for the hash fragment
/*import { redirectToAuthCodeFlow, getAccessToken } from "./authCodeWithPkce";

//Authorization
const clientId = "a3718ab598a34173befaf8cb61809ead";
const params = new URLSearchParams(window.location.search);
let code = params.get("code");

//API Call Variables
const limit = 50; // Number of items returned per call (0 - 50)
const retry_delay_factor = 5; // If error 429 happens, the suggested wait time (sec) will be multiplied by this much
const retry_delay = 30; // If error 429 happens AND there is no suggested wait time, API will wait this long
const max_retry_count = 100; //Number of times API will attempt to be called before error

const max_items = 60;
const term = "medium_term";

const curr_track_wait = 45000; // amount of time (ms) to wait in between calls to get user current playing track

//Library info
let track_count = 0;
let album_count = 0;*/

//const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database('mydatabase.db');

/*function authorize() {
    
}*/

/*code = "7QK--gFxHU5Vf_zijkRJ6pxgfbYukRDpgzw8PwVtsTbmdPlyM1KJu2yXTp2M-HdkiojsD7aonbv35aoXrf9OKauv6GF1G0lylJydSQZBommf6OxRmx-2bDaQL_xOuBK0VsiR5guEHBApb86g_mLyEFIn-qeEhljKS6BCvMTLtQNPxLqI2p4eHL2f7aPU35uZykaRdVV12aEwvRhvyFf15sFeQ5tR4UxdGmPyqE9EKVkSFt85iDL-YGfUiW8F48osITw"*/

//If authorization is accepted...
/*if (code) {

    console.log(code);

    const accessToken = await getAccessToken(clientId, code);

    /*console.log("requesting user's saved tracks...");
    const tracks = await getSavedTracks(accessToken);
    console.log(tracks);

    console.log("getting user's playlist tracks...");
    const tracks = await getPlaylistTracks(accessToken);
    console.log(tracks);

    console.log("finding user's artists from saved tracks...");
    const artists = getDistinctArtists(tracks);
    //console.log(artists);

    console.log("requesting each artist's albums...");
    const albums_all = await getArtistsAlbums(accessToken, tracks, artists);
    const albums = extractAlbumData(albums_all);
    //console.log(albums);

    console.log("requesting track info for each album...");
    const album_tracks = await getAlbumTracks(accessToken, albums);
    //console.log(album_tracks);

    console.log("requesting user's top items...");
    const top_items = await getTopItems(accessToken);
    //console.log(top_items);

    console.log("finding LT ratio per album...");
    getListenedToPerAlbum(album_tracks, tracks);
    //console.log(listened_to);

    console.log("finding number of songs per artist from saved tracks...");
    findCountsPerArtist(artists, tracks, albums);

   //console.log("finding feature count per artist");
    //featureCountForArtist(artists[0], albums);

    console.log("collecting user's currently playing tracks..."); 
    collectUserCurrentlyPlaying(accessToken);

    //console.log("getting newest albums from user library");
    //console.log(getNewAlbums(albums));

    //console.log("getting user's saved albums...");

    //await sleep(30000);

    //console.log("getting user's recent tracks...");
    //const recent_tracks = await getRecentTracks(accessToken);
    //console.log(recent_tracks);

    populateUI();

}
else {
    redirectToAuthCodeFlow(clientId);
}*/

// Processes track data from api into a more digestable form
// Takes: dictionary of dictionaries of arrays of 'tracks'
// Returns: array of tracks
function extractTrackData(raw_data) {

    let saved_tracks_list = [];
    let index = 0;

    //access each dictionary of arrays within result
    for (let track_set in Object.keys(raw_data)) {
        //access each array of tracks within this dictionary
        for (let track_data of raw_data[track_set].items) {
            saved_tracks_list[index] = {
                artist_name: track_data.track.artists[0].name,
                artist_id: track_data.track.artists[0].id,
                track_name: track_data.track.name,
                track_id: track_data.track.id
                //album_id: saved_tracks.items[j].track.album.id,
            }
            index++;
        }
    }

    track_count = index;

    return saved_tracks_list;
}

// Processes track data from api into a more digestable form
// Takes: dictionary of dictionaries of arrays of 'tracks'
// Returns: array of tracks
function extractAlbumData(raw_data) {

    let all_albums = [];
    let index = 0;

    //access each dictionary of arrays within result
    for (let album_set in Object.keys(raw_data)) {
        //access each array of tracks within this dictionary
        for (let album_data of raw_data[album_set].items) {

            all_albums[index] = {
                artist_id: album_data.artists[0].id,
                artist_name: album_data.artists[0].name,
                album_id: album_data.id,
                album_name: album_data.name,
                total_tracks: album_data.total_tracks,
                release_date: album_data.release_date
                //release_date: album_data.release_date,
                //album_cover: album_data.images.url
                //tracks: album_data.
                //artist_id: album_data.album.artists[0].id,
                //album_id: saved_tracks.items[j].track.album.id,
            }
            index++;
        }
    }

    album_count = index;

    return all_albums;
}

// Gets ALL saved tracks within a user's spotify library 
// Takes: spotify oauth token
// Returns: array of "track" objects containing data about the user's tracks
async function getSavedTracks(token) {

    //make initial api call to get total # of songs in user playlist
    const init_tracks = await fetchSavedTracks(token, 0);
    const total = init_tracks.total;

    let urls = [];

    //add all api calls to urls dict
    for (let i = 0; i < total / limit; i++) {
        urls.push('https://api.spotify.com/v1/me/tracks?limit=' + limit + '&offset=' + (i * limit));
    }

    //make calls to api
    let data = await fetchDataFromSpotify(urls, token);

    //format data then return
    return extractTrackData(data);
}

// Gets ALL saved tracks within a user's spotify library 
// Takes: spotify oauth token
// Returns: array of "track" objects containing data about the user's tracks
async function getPlaylistTracks(token) {

    const playlist_id = '6q7BtlMeqNtU0Bdk0Xpp0R';

    //make initial api call to get total # of songs in user playlist
    const init_playlist = await fetchPlaylistTracks(token, playlist_id, 0);
    const total = init_playlist.total;

    let urls = [];

    //add all api calls to urls dict
    for (let i = 0; i < total / limit; i++) {
        urls.push('https://api.spotify.com/v1/playlists/'+playlist_id+'/tracks?limit=' + limit + '&offset=' + (i * limit));
    }

    //make calls to api
    let data = await fetchDataFromSpotify(urls, token);

    //format data then return
    return extractTrackData(data);
}

// Gets ALL saved tracks within a user's spotify library 
// Takes: spotify oauth token
// Returns: array of "track" objects containing data about the user's tracks
async function getTopItems(token) {

    let urls = [];

    //add all api calls to urls dict
    for (let i = 0; i < max_items / 10; i++) {
       // console.log(i);
        urls.push('https://api.spotify.com/v1/me/top/artists?time_range=' + term + '&limit=' + 10 + '&offset=' + (i * 10));
    }

    //console.log(urls);

    //make calls to api
    let data = await fetchDataFromSpotify(urls, token);

    //format data then return
    return data;
}

//gets list of distinct artists from a list 

function getDistinctArtists(saved_tracks) {

    const num_of_tracks = Object.keys(saved_tracks).length;
    let raw_artists = [];

    // get artists from saved tracks
    for (var i = 0; i < num_of_tracks; i++)
        raw_artists.push(saved_tracks[i].artist_id);

    // set declaration removes duplicates
    return [...new Set(raw_artists)];
}

function featureCountForArtist(artist_id, albums) {

    //access each dictionary of arrays within result
    for (let album of albums) {
        console.log(album);
        //access each array of tracks within this dictionary
        /*for (let track of albums[album].items) {

            for(let artist in track.artists.length) {
                console.log(artist.id);
            }
        }*/
    }


}

async function getArtistsAlbums(token, saved_tracks, artists) {

    let urls = [];
    let artist_count = artists.length;

    // create API calls
    for (let i = 0; i < artist_count; i++) {
        urls.push('https://api.spotify.com/v1/artists/' + artists[i] + '/albums?include_groups=album&market=ES&limit=50&offset=0');
    }

    // make API calls
    let data = await fetchDataFromSpotify(urls, token);

    // return formated data
    return data;
}

async function getAlbumTracks(token, albums) {

    let urls = [];
    let total = albums.length;

    let url = 'https://api.spotify.com/v1/albums?ids=';
    let count = 0;

    for(let i = 0; i < total; i++) {

        url += albums[i].album_id + ",";
        count++;

        //max of 20 albums per API request
        if((i+1) % 20 == 0) {

            url = url.slice(0, -1);
            urls.push(url);
            url = 'https://api.spotify.com/v1/albums?ids=';
            count = 0;
        }
    }

    // push remaining URLS (less than 20 in this array)
    if(count > 0) {
        url = url.slice(0, -1);
        urls.push(url);
    }

    let data = await fetchDataFromSpotify(urls, token);

    let albums_list = [];

    for(let album_group of data) {
        for(let album_item in album_group) {
            albums_list = albums_list.concat(album_group[album_item]);
        }
    }

    return albums_list;
}

function getListenedToPerAlbum(albums, saved_tracks) {
    
    let count = 0;
    let threshold = 0.1;

    let albums_never_saved = [];
    let albums_minority_saved = [];
    let albums_majority_saved = [];

    for(let album in albums) {
        for(let track of albums[album].tracks.items) {

            if(saved_tracks.some(item => item.track_id === track.id))
                count++;
        }

        let track_count = albums[album].total_tracks;

        albums[album].tracks_saved = count;

        let lt_ratio = count / track_count;

        if(lt_ratio == 0) {
            albums_never_saved.push(albums[album]);
        }
        else if(lt_ratio <= threshold) {
            albums_minority_saved.push(albums[album]);
        }
        else {
            albums_majority_saved.push(albums[album]);
        }

        count = 0;
    }

    console.log(albums_never_saved);
    console.log(albums_minority_saved);
    console.log(albums_majority_saved);

}

// find number of songs per each artist appearing in user's library

function findCountsPerArtist(artists, tracks, albums) {

    let track_count = 0, album_count = 0;
    let index = 0;
    let artists_saved = {};

    for(let artist of artists) {
        for(let track in tracks) {

            if(tracks[track].artist_id == artist)
                track_count++;
        }
        for(let album in albums) {

            if(albums[album].artist_id == artist)
                album_count++;
        }
        
        artists_saved[index] = {
            artist_id: artist,
            saved_tracks: track_count,
            saved_albums: album_count
        }

        track_count = 0, album_count = 0;
        index++;
    }

    //console.log(artists_saved);
}

function getNewAlbums(albums) {

    let new_albums = {};

    // Parse the given date into a Date object
    for(let album of albums) {
        var givenDate = new Date(album.release_date);
        //console.log(album.release_date);

        // Get the current date
        var currentDate = new Date();

        // Calculate the difference in months
        var diffMonths = (currentDate.getFullYear() - givenDate.getFullYear()) * 12 + (currentDate.getMonth() - givenDate.getMonth());
        

        if(diffMonths <= 6)
            //new_albums.push(album);
            console.log(album);
    }

    return new_albums;
}

function populateUI() {

    document.getElementById("track-count").innerText = track_count;
    document.getElementById("album-count").innerText = album_count;
    //document.getElementById("time-diff").innerText = time_diff + "s";
}