import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');

    if (!subjectId || !season || !episode) {
        return NextResponse.json({ error: 'subjectId, season, and episode parameters are required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.sansekai.my.id/api/moviebox/sources?subjectId=${encodeURIComponent(subjectId)}&season=${encodeURIComponent(season)}&episode=${encodeURIComponent(episode)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://api.sansekai.my.id/'
            }
        });
        const data = await response.json();

        if (data && data.processedSources) {
            data.processedSources = data.processedSources.map((source: any) => {
                const sansekaiDirectUrl = `https://api.sansekai.my.id/api/moviebox/direct-stream?url=${encodeURIComponent(source.directUrl)}`;
                return {
                    ...source,
                    directUrl: `/api/proxy/video?url=${encodeURIComponent(sansekaiDirectUrl)}&referer=${encodeURIComponent('https://api.sansekai.my.id/')}`
                };
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Moviebox watch sources error:', error);
        return NextResponse.json({ error: 'Failed to fetch moviebox sources' }, { status: 500 });
    }
}
