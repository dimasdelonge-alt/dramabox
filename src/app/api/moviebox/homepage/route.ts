import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const response = await fetch('https://api.sansekai.my.id/api/moviebox/homepage', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://api.sansekai.my.id/'
            }
        });
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Moviebox homepage error:', error);
        return NextResponse.json({ error: 'Failed to fetch moviebox homepage' }, { status: 500 });
    }
}
