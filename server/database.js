import mysql from 'mysql2';
import moment from 'moment';

var con = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQLPORT
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to railway db");
});

const createUsersTable = `
    CREATE TABLE IF NOT EXISTS Users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        date_created DATE
    );
`;

const createPlayedTracksTable = `
    CREATE TABLE IF NOT EXISTS PlayedTracks (
        id VARCHAR(36) PRIMARY KEY,
        track_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        time_played BIGINT NOT NULL,
        track_data TEXT,
        
        UNIQUE (track_id, user_id, time_played),
        FOREIGN KEY (user_id) REFERENCES Users(id)
    );
`;

const createSuggestedAlbumsTable = `
    CREATE TABLE IF NOT EXISTS SuggestedAlbums (
        id VARCHAR(36) PRIMARY KEY,
        album_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL, 
        time_suggested INTEGER NOT NULL,
        album_data TEXT,

        UNIQUE (album_id, user_id, time_suggested),
        FOREIGN KEY (user_id) REFERENCES Users(id)
    );
`;

export async function setup() {

    con.query(createUsersTable, function(err) {
        if (err) { throw err; }
        console.log('Users table created successfully');
    });

    con.query(createPlayedTracksTable, function(err) {
        if (err) { throw err; }
        console.log('PlayedTracks table created successfully');
    });

    con.query(createSuggestedAlbumsTable, function(err) {
        if (err) { throw err; }
        console.log('SuggestedAlbums table created successfully');
    });
}

// adds a new user to the database
export async function add_user(user, access_token, refresh_token) {

    const insertQuery = `
    INSERT INTO Users 
    (id, username, display_name, access_token, refresh_token, date_created) 
    VALUES (UUID(), ?, ?, ?, ?, ?)`;

    const curr_date = moment();
    const formatted_date = curr_date.format('YYYY-MM-DD');

    con.query(insertQuery, [user.id, user.display_name, access_token, refresh_token, formatted_date], function(err) {
        if (err) {
            if (err.errno === 1062) {}
            else console.error(err.errno + ": " + err.message);
        } else
            console.log(user.id + ' added to users');
    });
}

// adds a new track to the database
export async function add_track(user, track) {

    const insertQuery = `
    INSERT INTO PlayedTracks 
    (id, track_id, user_id, time_played, track_data) 
    VALUES (UUID(), ?, ?, ?, ?)`;

    con.query(insertQuery, [track.item.id, user.id, track.timestamp, JSON.stringify(track)], function(err) {
        if (err) {
            if (err.errno === 1062) {}
            else console.error(err.errno + ": " + err.message);
        } else
            console.log(user.username + " played " + track.item.name);
    });
}

// updates user's access token in the database 
// the new token has already been fetched at this point, this simply stores the new token
export async function update_token(user, new_access_token) {

    const updateQuery = `
    UPDATE Users
    SET access_token = ?
    WHERE id = ?;`;

    con.query(updateQuery, [new_access_token, user.id], function(err) {
        if (err) {
            console.error('Error updating ' + user.username + ' refresh token');
        } else {
            console.log(`User ${user.username} updated successfully.`);
        }
    });
}

// return single user
// export function retrieve_user(user) {
//     return new Promise((response, error) => {
//         const query = 'SELECT * FROM Users WHERE id = ?';
//         db.get(query, [user.id], function (err, row) {
//             if (err) {
//                 console.error('Error retrieving users:', err.message);
//                 error(err);
//             } else {
//                 response(row);
//             }
//         });
//     });
// }

//returns an array of all users within the database
export function retrieve_users() {

    return new Promise((response, error) => {

        // Query to retrieve all users
        const query = 'SELECT * FROM Users';

        // Array to store the retrieved users
        const user_list = [];

        // Execute the query
        con.query(query, function(err, rows) {
            if (err) {
                console.error('Error retrieving users:', err.message);
                error(err);
            } else {
                // Loop through the rows and add each user to the array
                rows.forEach(row => {
                    user_list.push({
                        id: row.id,
                        username: row.username,
                        display_name: row.display_name,
                        access_token: row.access_token,
                        refresh_token: row.refresh_token,
                    });
                });

                response(user_list);
            }
        });
    });
}

/*connection.end((err) => {
    if (err) {
      console.error('Error closing MySQL connection:', err);
    }
    console.log('MySQL connection closed');
});*/
