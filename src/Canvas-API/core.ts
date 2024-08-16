import fetch from 'node-fetch'

async function getAPI(url: string, accessToken: string): Promise<any> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

export { getAPI }