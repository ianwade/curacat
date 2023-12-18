export async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

export async function fetchPlaybackState(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    //track is not playing
    if (result.status === 204)
        return {};

    return await result.json();
}