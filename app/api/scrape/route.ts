// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';
import * as cheerio from 'cheerio';

const REDIS_CONFIG = {
  username: 'default',
  password: 'BqkOfUe6FNNFOlh6jn2ZCQrDJ1Y9RiAQ',
  socket: {
    host: 'redis-19701.c266.us-east-1-3.ec2.cloud.redislabs.com',
    port: 19701
  }
};

const REDIS_KEY = 'hackathons:amsterdam';
const CACHE_EXPIRY = 1800; // 30 minutes in seconds

interface HackathonEvent {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string;
  url: string;
  source: string;
  tags?: string[];
}

async function fetchLumaEvents(): Promise<HackathonEvent[]> {
  try {
    const res = await fetch(
      'https://api2.luma.com/discover/get-paginated-events?discover_place_api_id=discplace-FC4SDMUVXiFtMOr&pagination_limit=500',
      { cache: 'no-store' }
    );
    
    if (!res.ok) throw new Error('Luma API failed');
    
    const data = await res.json();
    const events = data.entries || [];
    
    // Filter for hackathon/tech events in December
    return events
      .filter((e: any) => {
        const name = e.event?.name?.toLowerCase() || '';
        const desc = e.event?.description?.toLowerCase() || '';
        const startDate = new Date(e.event?.start_at);
        const month = startDate.getMonth();
        
        const isHackathon = 
          name.includes('hackathon') || 
          name.includes('hack ') ||
          desc.includes('hackathon') ||
          name.includes('tech') ||
          name.includes('developer') ||
          name.includes('coding') ||
          name.includes('code') ||
          name.includes('learn') ||
          name.includes('n8n') ||
          name.includes('development') ||
          name.includes('Loveable') ||
          name.includes('claude');
        
        const isDecember = month === 11; // December is month 11
        
        return isHackathon && isDecember;
      })
      .map((e: any) => ({
        id: `luma-${e.event?.api_id || Math.random()}`,
        name: e.event?.name || 'Untitled Event',
        description: e.event?.description?.substring(0, 200),
        startDate: e.event?.start_at,
        endDate: e.event?.end_at,
        location: e.event?.geo_address_json?.city || 'Amsterdam',
        url: e.event?.url || `https://lu.ma/${e.event?.api_id}`,
        source: 'Luma',
        tags: e.event?.tags || []
      }));
  } catch (err: unknown) {
    console.error('Luma fetch error:', err);
    return [];
  }
}

async function fetchEventbriteEvents(): Promise<HackathonEvent[]> {
  // Placeholder for Eventbrite API
  // You'll need an API key from Eventbrite
  try {
    // Example: Search for hackathons near Amsterdam
    // const res = await fetch(
    //   'https://www.eventbriteapi.com/v3/events/search/?location.address=Amsterdam&q=hackathon',
    //   { headers: { 'Authorization': `Bearer YOUR_TOKEN` } }
    // );
    return [];
  } catch (err: unknown) {
    console.error('Eventbrite fetch error:', err);
    return [];
  }
}

async function fetchMeetupEvents(): Promise<HackathonEvent[]> {
  try {
    // Meetup URLs for Amsterdam tech/hackathon events
    const searchUrls = [
      'https://www.meetup.com/find/?keywords=Tech&source=EVENTS',
      'https://www.meetup.com/find/?keywords=tech&location=nl--Amsterdam',
      'https://www.meetup.com/find/?keywords=developer&location=nl--Amsterdam'
    ];
    
    const allEvents: HackathonEvent[] = [];
    
    for (const url of searchUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.log(`Failed to fetch ${url}: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Method 1: Look for event cards with data attributes
        $('[data-element-name="event-card"]').each((_: number, element: any) => {
          try {
            const $card = $(element);
            
            // Extract event name from h3 heading
            const name = $card.find('h3').first().text().trim();
            if (!name) return;
            
            // Extract URL
            const eventLink = $card.find('a[href*="/events/"]').first().attr('href');
            const fullUrl = eventLink?.startsWith('http') 
              ? eventLink 
              : `https://www.meetup.com${eventLink}`;
            
            // Extract date information
            const dateText = $card.find('time').attr('datetime') || 
                           $card.find('[data-element-name="event-time"]').text().trim();
            
            // Extract location
            const location = $card.find('[data-element-name="event-location"]').text().trim() || 
                           'Amsterdam';
            
            // Extract group name (can be used as description)
            const groupName = $card.find('[data-element-name="group-name"]').text().trim();
            
            // Generate event ID from URL or name
            const eventId = eventLink?.split('/').pop() || 
                          `meetup-${name.replace(/\s+/g, '-').toLowerCase()}`;
            
            if (name && fullUrl) {
              allEvents.push({
                id: `meetup-${eventId}`,
                name,
                description: groupName || undefined,
                startDate: dateText || new Date().toISOString(),
                location,
                url: fullUrl,
                source: 'Meetup',
                tags: ['tech']
              });
            }
          } catch (err) {
            console.error('Error parsing event card:', err);
          }
        });
        
        // Method 2: Alternative selector patterns (Meetup's structure can vary)
        $('article, [role="article"]').each((_: number, element: any) => {
          try {
            const $card = $(element);
            
            // Look for event title in h3 tags with specific classes
            const name = $card.find('h3.ds2-m18, h3[class*="line-clamp"]').first().text().trim();
            if (!name || name.length < 3) return;
            
            // Skip if already added
            if (allEvents.some(e => e.name === name)) return;
            
            // Find the link
            const eventLink = $card.find('a[href*="/events/"]').first().attr('href');
            if (!eventLink) return;
            
            const fullUrl = eventLink.startsWith('http') 
              ? eventLink 
              : `https://www.meetup.com${eventLink}`;
            
            // Extract date
            const timeElement = $card.find('time').first();
            const dateTime = timeElement.attr('datetime') || timeElement.text().trim();
            
            // Extract location
            const locationText = $card.find('[data-testid*="location"], p:contains("•")').text().trim();
            const location = locationText || 'Amsterdam';
            
            allEvents.push({
              id: `meetup-${eventLink.split('/').pop()}`,
              name,
              description: undefined,
              startDate: dateTime || new Date().toISOString(),
              location,
              url: fullUrl,
              source: 'Meetup',
              tags: ['tech']
            });
          } catch (err) {
            console.error('Error parsing article element:', err);
          }
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
      }
    }
    
    // Filter for December events and hackathon-related
    const decemberEvents = allEvents.filter(event => {
      const date = new Date(event.startDate);
      const month = date.getMonth();
      const name = event.name.toLowerCase();
      
      const isDecember = month === 11; // December is month 11
      const isRelevant = 
        name.includes('hackathon') || 
        name.includes('hack ') ||
        name.includes('tech') ||
        name.includes('developer') ||
        name.includes('coding') ||
        name.includes('code');
      
      return isDecember && isRelevant;
    });
    
    // Remove duplicates based on name
    const uniqueEvents = decemberEvents.reduce((acc: HackathonEvent[], curr) => {
      const exists = acc.some(e => e.name === curr.name);
      if (!exists) acc.push(curr);
      return acc;
    }, []);
    
    console.log(`Found ${uniqueEvents.length} relevant Meetup events`);
    return uniqueEvents;
    
  } catch (err: unknown) {
    console.error('Meetup fetch error:', err);
    return [];
  }
}




export async function POST() {
  let redisClient: RedisClientType | null = null;
  
  try {
    // Connect to Redis
    redisClient = createClient(REDIS_CONFIG);
    await redisClient.connect();
    
    console.log('Fetching hackathon events...');
    
    // Fetch from all sources in parallel
    const [lumaEvents, eventbriteEvents, meetupEvents] = await Promise.all([
      fetchLumaEvents(),
      fetchEventbriteEvents(),
      fetchMeetupEvents()
    ]);
    
    // Combine and deduplicate events
    const allEvents = [...lumaEvents, ...eventbriteEvents, ...meetupEvents];
    
    // Remove duplicates based on name and date
    const uniqueEvents = allEvents.reduce((acc: HackathonEvent[], curr) => {
      const exists = acc.some(
        e => e.name === curr.name && e.startDate === curr.startDate
      );
      if (!exists) acc.push(curr);
      return acc;
    }, []);
    
    // Sort by start date
    uniqueEvents.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    const result = {
      timestamp: new Date().toISOString(),
      total: uniqueEvents.length,
      events: uniqueEvents
    };
    
    // Store in Redis with expiry
    await redisClient.set(REDIS_KEY, JSON.stringify(result), {
      EX: CACHE_EXPIRY
    });
    
    console.log(`Stored ${uniqueEvents.length} events in Redis`);
    
    await redisClient.disconnect();
    
    return NextResponse.json({
      success: true,
      message: `Fetched and stored ${uniqueEvents.length} hackathon events`,
      data: result
    });
    
  } catch (err: unknown) {
    console.error('API Error:', err);
    if (redisClient) await redisClient.disconnect();
    
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  let redisClient: RedisClientType | null = null;
  
  try {
    // Connect to Redis
    redisClient = createClient(REDIS_CONFIG);
    await redisClient.connect();
    
    // Retrieve cached data
    const cached = await redisClient.get(REDIS_KEY);
    
    await redisClient.disconnect();
    
    if (!cached) {
      return NextResponse.json({
        success: false,
        message: 'No cached data found. Trigger POST /api/scrape to fetch events.'
      }, { status: 404 });
    }
    
    const data = JSON.parse(cached);
    
    return NextResponse.json({
      success: true,
      cached: true,
      data
    });
    
  } catch (err: unknown) {
    console.error('API Error:', err);
    if (redisClient) await redisClient.disconnect();
    
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}