import { NextResponse } from 'next/server';

const UPSTREAM_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://api.sansekai.my.id/'
};

async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
    let lastResponse: Response | null = null;
    for (let i = 0; i <= maxRetries; i++) {
        const response = await fetch(url, { headers: UPSTREAM_HEADERS });
        if (response.ok) return response;
        lastResponse = response;
        // Wait before retrying (500ms, 1000ms)
        if (i < maxRetries) {
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }
    }
    return lastResponse!;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
        return NextResponse.json({ error: 'subjectId parameter is required' }, { status: 400 });
    }

    try {
        const response = await fetchWithRetry(
            `https://api.sansekai.my.id/api/moviebox/detail?subjectId=${encodeURIComponent(subjectId)}`
        );

        if (!response.ok) {
            console.error(`Moviebox detail upstream error: ${response.status} for subjectId=${subjectId}`);
            return NextResponse.json(
                { error: 'Upstream API error', status: response.status, subjectId },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Moviebox detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch moviebox detail' }, { status: 500 });
    }
}
