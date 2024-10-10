import fetch from 'node-fetch'

// interface GetAPIResult {
//     readonly data: Object;
//     readonly error
// }

async function getAPI(url: string, accessToken: string) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok)
        throw new Error(`Response Status: ${response.status}`);

    return response.json();
}

export { getAPI }