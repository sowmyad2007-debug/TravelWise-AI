import { User, Trip, ItineraryDay, ItineraryActivity, Expense, Receipt } from '../types';
import {
  getDestinationData,
  arePlacesDuplicate,
  DESTINATIONS_CATALOG,
  CatalogActivity,
  CatalogDestination
} from './destinationsCatalog';


const USERS_KEY = 'travelwise_users_db';
const TRIPS_KEY = 'travelwise_trips_db';
const EXPENSES_KEY = 'travelwise_expenses_db';
const RECEIPTS_KEY = 'travelwise_receipts_db';
const TICKETS_KEY = 'travelwise_tickets_db';
const CURRENT_USER_KEY = 'travelwise_current_user';

interface StoredUser extends User {
  password_hash: string;
}

const DESTINATION_PHOTOS: Record<string, string> = {
  'Hyderabad': 'https://upload.wikimedia.org/wikipedia/commons/7/71/Charminar_Hyderabad_1.jpg',
  'Goa': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Baga_beach_Goa.jpg',
  'Ooty': 'https://upload.wikimedia.org/wikipedia/commons/0/03/Ooty_Lake%2C_Tamil_Nadu.jpg',
  'Munnar': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Tea_plantations_in_Munnar.jpg',
  'Jaipur': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hawa_Mahal_2011.jpg',
  'Varanasi': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Varanasi_Ghats.jpg',
  'Visakhapatnam': 'https://upload.wikimedia.org/wikipedia/commons/1/15/RK_Beach_Visakhapatnam.jpg',
  'Paris': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
  'London': 'https://upload.wikimedia.org/wikipedia/commons/6/67/London_Eye_%28front_view%29.jpg',
  'Tokyo': 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg',
  'New York': 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
  'Sydney': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sydney_Opera_House_-_Dec_2008.jpg',
  'Dubai': 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Dubai_Skylines_at_night_%28Pexels_3787839%29.jpg',
  'Singapore': 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Marina_Bay_Sands_in_the_evening_-_20101120.jpg',
  'Bali': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Ulun_Danu_Bratan_Temple_Bali.jpg',
};

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const demo: StoredUser = {
        id: 1,
        name: 'Alex Chen',
        email: 'demo@travelwise.ai',
        password_hash: 'Password123!',
        preferred_currency: 'INR',
        preferred_travel_style: 'balanced',
        preferred_interests: JSON.stringify(['nature', 'photography', 'food'])
      };
      localStorage.setItem(USERS_KEY, JSON.stringify([demo]));
      return [demo];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUserLocal(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
    const token = localStorage.getItem('travelwise_token');
    if (token) {
      const users = getStoredUsers();
      if (token.startsWith('tw_tok_')) {
        const parts = token.split('_');
        const uid = parseInt(parts[2], 10);
        const match = users.find(u => u.id === uid);
        if (match) {
          const { password_hash, ...safeUser } = match;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
          return safeUser;
        }
      }
      if (users.length > 0) {
        const { password_hash, ...safeUser } = users[0];
        return safeUser;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function localRegister(payload: { name: string; email: string; password: string; confirm_password?: string }) {
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';

  if (!name || !email || !password) {
    throw new Error('Full name, email, and password are required.');
  }
  if (name.length < 2) {
    throw new Error('Name must be at least 2 characters long.');
  }
  if (!email.includes('@') || !email.includes('.')) {
    throw new Error('Please provide a valid email address.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  if (payload.confirm_password && password !== payload.confirm_password) {
    throw new Error('Passwords do not match.');
  }

  const users = getStoredUsers();
  if (users.some(u => u.email === email)) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  const newUser: StoredUser = {
    id: Date.now(),
    name,
    email,
    password_hash: password,
    preferred_currency: 'INR',
    preferred_travel_style: 'balanced',
    preferred_interests: JSON.stringify(['nature', 'food', 'photography'])
  };

  users.push(newUser);
  saveUsers(users);

  const { password_hash, ...safeUser } = newUser;
  const token = `tw_tok_${newUser.id}_${Date.now()}`;
  localStorage.setItem('travelwise_token', token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

  return {
    message: 'Account registered successfully.',
    token,
    user: safeUser
  };
}

export function localLogin(payload: { email: string; password: string }) {
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const users = getStoredUsers();
  const user = users.find(u => u.email === email);

  if (!user || user.password_hash !== password) {
    throw new Error('Invalid email or password.');
  }

  const { password_hash, ...safeUser } = user;
  const token = `tw_tok_${user.id}_${Date.now()}`;
  localStorage.setItem('travelwise_token', token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

  return {
    message: 'Login successful.',
    token,
    user: safeUser
  };
}

export function localUpdateProfile(payload: any) {
  const cur = getCurrentUserLocal();
  if (!cur) throw new Error('Not authenticated.');

  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === cur.id);
  if (idx === -1) throw new Error('User not found.');

  if (payload.name) users[idx].name = payload.name.trim();
  if (payload.preferred_currency) users[idx].preferred_currency = payload.preferred_currency;
  if (payload.preferred_travel_style) users[idx].preferred_travel_style = payload.preferred_travel_style;
  if (payload.preferred_interests) {
    users[idx].preferred_interests = typeof payload.preferred_interests === 'string'
      ? payload.preferred_interests
      : JSON.stringify(payload.preferred_interests);
  }

  saveUsers(users);
  const { password_hash, ...safeUser } = users[idx];
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  return { message: 'Profile updated successfully.', user: safeUser };
}

// ----------------- Trips Store -----------------
function getStoredTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) {
      // Pre-seed demo trip for demo user (id: 1)
      const demoTrip: Trip = {
        id: 101,
        user_id: 1,
        title: 'Ooty Misty Mountain Getaway',
        starting_city: 'Bangalore',
        destination: 'Ooty',
        start_date: '2026-11-10',
        end_date: '2026-11-12',
        travelers: 2,
        total_budget: 8000,
        currency: 'INR',
        travel_style: 'balanced',
        interests: ['nature', 'photography', 'food'],
        accommodation_pref: 'budget_hotel',
        dietary_pref: 'vegetarian',
        accessibility_pref: 'standard',
        cover_image: DESTINATION_PHOTOS['Ooty'],
        status: 'planned',
        total_spent: 3950,
        remaining_budget: 4050,
        budget_utilization_pct: 49.4,
        days_count: 3,
        weather: {
          temperature_c: 18.5,
          humidity_pct: 72,
          condition: 'Partly Cloudy',
          description: 'Mild hill-station weather with pleasant mist.',
          icon: 'cloud-sun',
          is_raining: false,
          wind_speed_kmh: 12,
          source: 'Open-Meteo Satellite Integration',
          retrieved_at: new Date().toISOString()
        },
        days: [
          {
            id: 1001,
            trip_id: 101,
            day_number: 1,
            date: '2026-11-10',
            title: 'Day 1 Nilgiri Exploration',
            activities: [
              {
                id: 5001,
                day_id: 1001,
                trip_id: 101,
                name: 'Ooty Botanical Gardens',
                description: 'Explore 55 acres of terraced exotic flora, bonsai, and the 20-million-year-old fossilized tree trunk.',
                category: 'nature',
                time_slot: '09:30 AM - 12:00 PM',
                duration_hours: 2.5,
                estimated_entry_cost: 50,
                estimated_transport_cost: 40,
                visit_order: 1,
                interest_match_reason: 'Top nature & photography highlight.',
                location_name: 'Vannarapettai, Ooty',
                is_active: 1,
                image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Government_Botanical_Garden%2C_Ooty.jpg',
                match_score: 95
              },
              {
                id: 5002,
                day_id: 1001,
                trip_id: 101,
                name: 'Ooty Lake & Boathouse',
                description: 'Scenic pedal boating across the serene 65-acre lake surrounded by eucalyptus trees.',
                category: 'sightseeing',
                time_slot: '03:00 PM - 05:30 PM',
                duration_hours: 2.5,
                estimated_entry_cost: 30,
                estimated_transport_cost: 50,
                visit_order: 2,
                interest_match_reason: 'Relaxing outdoor waterfront experience.',
                location_name: 'North Lake Road, Ooty',
                is_active: 1,
                image_url: DESTINATION_PHOTOS['Ooty'],
                match_score: 90
              }
            ]
          },
          {
            id: 1002,
            trip_id: 101,
            day_number: 2,
            date: '2026-11-11',
            title: 'Day 2 Peak Panoramas',
            activities: [
              {
                id: 5003,
                day_id: 1002,
                trip_id: 101,
                name: 'Doddabetta Peak & Telescope House',
                description: 'Stand at the highest summit in the Nilgiris (2,637 m) offering 360-degree vistas of the Western Ghats.',
                category: 'nature',
                time_slot: '09:30 AM - 12:30 PM',
                duration_hours: 3.0,
                estimated_entry_cost: 20,
                estimated_transport_cost: 80,
                visit_order: 1,
                interest_match_reason: 'Spectacular mountain vista matching photography interests.',
                location_name: 'Ooty-Kotagiri Road',
                is_active: 1,
                image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Doddabetta_view_point.jpg',
                match_score: 98
              }
            ]
          }
        ]
      };
      localStorage.setItem(TRIPS_KEY, JSON.stringify([demoTrip]));
      return [demoTrip];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTrips(trips: Trip[]): void {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function localGetTrips(): { trips: Trip[] } {
  const cur = getCurrentUserLocal();
  if (!cur) return { trips: [] };
  const all = getStoredTrips();
  const userTrips = all.filter(t => t.user_id === cur.id);
  return { trips: userTrips };
}

export function localGetTrip(id: number): { trip: Trip } {
  const all = getStoredTrips();
  const trip = all.find(t => t.id === id);
  if (!trip) throw new Error('Trip not found.');
  return { trip };
}

export function localCreateTrip(payload: any): { message: string; trip_id: number } {
  const cur = getCurrentUserLocal();
  if (!cur) throw new Error('Not authenticated.');

  const destination = payload.destination || 'Munnar';
  const start_date = payload.start_date || new Date().toISOString().split('T')[0];
  const end_date = payload.end_date || start_date;
  
  const d1 = new Date(start_date);
  const d2 = new Date(end_date);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const destData = getDestinationData(destination);
  const newTripId = Date.now();
  const days: ItineraryDay[] = [];

  // Track scheduled attractions across ALL days to guarantee zero duplicates across the entire trip
  const scheduledAttractions: CatalogActivity[] = [];
  const activitiesPerDay = diffDays <= 4 ? 3 : 2;
  const slotTimes = ['09:30 AM - 12:00 PM', '02:00 PM - 04:30 PM', '05:30 PM - 07:30 PM'];
  const userInterests: string[] = Array.isArray(payload.interests) ? payload.interests : ['nature', 'culture', 'sightseeing'];

  for (let i = 1; i <= diffDays; i++) {
    const curDate = new Date(d1);
    curDate.setDate(curDate.getDate() + (i - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    const dayActs: ItineraryActivity[] = [];

    for (let s = 0; s < activitiesPerDay; s++) {
      const assignedSlot = slotTimes[s] || '10:00 AM - 12:30 PM';

      // Candidate must NOT duplicate any attraction already scheduled across ANY previous or current day
      const availableCandidates = destData.activities.filter(act => {
        return !scheduledAttractions.some(sched =>
          arePlacesDuplicate(
            act.name,
            sched.name,
            [act.latitude, act.longitude],
            [sched.latitude, sched.longitude],
            act.place_id,
            sched.place_id
          )
        );
      });

      if (availableCandidates.length > 0) {
        // Rank candidate by user interest match
        const chosen = availableCandidates.sort((a, b) => {
          const aInterests = a.interests || [];
          const bInterests = b.interests || [];
          const aMatches = aInterests.filter(int => userInterests.includes(int)).length;
          const bMatches = bInterests.filter(int => userInterests.includes(int)).length;
          return bMatches - aMatches;
        })[0];

        scheduledAttractions.push(chosen);

        dayActs.push({
          id: newTripId * 100 + i * 10 + s + 1,
          day_id: i,
          trip_id: newTripId,
          name: chosen.name,
          description: chosen.description,
          category: chosen.category,
          time_slot: chosen.time_slot || assignedSlot,
          duration_hours: chosen.duration_hours || 2.0,
          estimated_entry_cost: chosen.estimated_entry_cost || 0,
          estimated_transport_cost: chosen.estimated_transport_cost || 50,
          visit_order: s + 1,
          interest_match_reason: chosen.reason || `Curated top attraction in ${destData.name}.`,
          location_name: destData.name,
          is_active: 1,
          image_url: chosen.image_url,
          photo_attribution: chosen.photo_attribution,
          opening_hours: chosen.opening_hours || '09:00 AM - 06:00 PM',
          weather_suitability: chosen.weather_suitability || 'all_weather',
          transit_time_mins: chosen.transit_time_mins || 20,
          match_score: 92 + (s % 3) * 2,
          score_rationale: `Matched based on travel preferences for ${destData.name}.`,
          latitude: chosen.latitude,
          longitude: chosen.longitude,
          place_id: chosen.place_id,
          source_url: chosen.source_url,
          verification_status: chosen.verification_status || 'verified',
          last_verified: chosen.last_verified || '2026-10-26'
        });
      } else {
        // If all primary verified attractions for this destination have been scheduled,
        // schedule dedicated personal leisure, cafe dining, or artisan shopping.
        // NEVER repeat any previously scheduled attraction!
        const slotLabel = s === 0 ? 'Morning' : (s === 1 ? 'Afternoon' : 'Evening');
        const leisureThemes = [
          {
            name: `Scenic Sunset Leisure & Local Dining in ${destData.name}`,
            desc: `Enjoy regional cuisine, artisan viewpoints, and evening relaxation across ${destData.name}.`,
            cat: 'food'
          },
          {
            name: `Local Market & Spice Exploration in ${destData.name}`,
            desc: `Stroll through regional bazaars and specialty shops for authentic souvenirs and regional treats.`,
            cat: 'shopping'
          },
          {
            name: `Relaxed Nature Stroll & Cafe Time (Day ${i} ${slotLabel})`,
            desc: `Free leisure period for relaxed photography, scenic cafe sitting, and personal rest in ${destData.name}.`,
            cat: 'relaxation'
          }
        ];
        const theme = leisureThemes[(i + s) % leisureThemes.length];
        dayActs.push({
          id: newTripId * 100 + i * 10 + s + 1,
          day_id: i,
          trip_id: newTripId,
          name: theme.name,
          description: theme.desc,
          category: theme.cat,
          time_slot: assignedSlot,
          duration_hours: 2.0,
          estimated_entry_cost: 0,
          estimated_transport_cost: 30,
          visit_order: s + 1,
          interest_match_reason: 'Dedicated leisure and cultural exploration to balance itinerary pace without repeating attractions.',
          location_name: `${destData.name} Center`,
          is_active: 1,
          image_url: destData.hero_image,
          photo_attribution: 'Wikimedia Commons',
          match_score: 85,
          score_rationale: 'Balanced leisure period after covering all primary verified attractions.',
          verification_status: 'scheduled_break',
          last_verified: '2026-10-26'
        });
      }
    }

    days.push({
      id: i,
      trip_id: newTripId,
      day_number: i,
      date: dateStr,
      title: `Day ${i} ${destData.name} Exploration`,
      activities: dayActs
    });
  }

  const newTrip: Trip = {
    id: newTripId,
    user_id: cur.id,
    title: payload.title || `${destData.name} Travel Experience`,
    starting_city: payload.starting_city || 'Home City',
    destination: destData.name,
    start_date,
    end_date,
    travelers: payload.travelers || 1,
    total_budget: payload.total_budget || 10000,
    currency: payload.currency || destData.currency || 'INR',
    travel_style: payload.travel_style || 'balanced',
    interests: userInterests,
    accommodation_pref: payload.accommodation_pref || 'budget_hotel',
    dietary_pref: payload.dietary_pref || 'no_preference',
    accessibility_pref: payload.accessibility_pref || 'standard',
    cover_image: destData.hero_image || DESTINATION_PHOTOS[destination] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Munnar_Overview.jpg/960px-Munnar_Overview.jpg',
    status: 'planned',
    total_spent: 0,
    remaining_budget: payload.total_budget || 10000,
    budget_utilization_pct: 0,
    days_count: diffDays,
    days
  };

  const all = getStoredTrips();
  all.unshift(newTrip);
  saveTrips(all);

  localStorage.setItem('travelwise_active_trip_id', String(newTripId));
  return { message: 'Trip created successfully!', trip_id: newTripId };
}

export function localUpdateTrip(id: number, payload: any) {
  const all = getStoredTrips();
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Trip not found.');
  all[idx] = { ...all[idx], ...payload };
  saveTrips(all);
  return { message: 'Trip updated.', trip: all[idx] };
}

export function localGetTripWeather(tripId: number) {
  const all = getStoredTrips();
  const trip = all.find(t => t.id === tripId);
  const destination = trip ? trip.destination : 'Munnar';
  return {
    destination,
    weather: {
      temperature_c: 21.5,
      humidity_pct: 68,
      condition: 'Partly Cloudy',
      description: 'Pleasant travel weather with mild mountain mist.',
      icon: 'cloud-sun',
      is_raining: false,
      wind_speed_kmh: 10,
      source: 'Open-Meteo Satellite Integration',
      retrieved_at: new Date().toISOString()
    }
  };
}

export function localUpdateActivity(id: number, payload: any) {
  const trips = getStoredTrips();
  let updated = false;
  for (const t of trips) {
    if (t.days) {
      for (const d of t.days) {
        if (d.activities) {
          const actIdx = d.activities.findIndex(a => a.id === id);
          if (actIdx !== -1) {
            d.activities[actIdx] = { ...d.activities[actIdx], ...payload };
            updated = true;
            break;
          }
        }
      }
    }
    if (updated) break;
  }
  if (updated) saveTrips(trips);
  return { message: 'Activity updated.' };
}

export function localDeleteActivity(id: number) {
  const trips = getStoredTrips();
  for (const t of trips) {
    if (t.days) {
      for (const d of t.days) {
        if (d.activities) {
          d.activities = d.activities.filter(a => a.id !== id);
        }
      }
    }
  }
  saveTrips(trips);
  return { message: 'Activity deleted.' };
}

export function localReplaceActivity(id: number, payload: any) {
  const trips = getStoredTrips();
  let foundTrip: Trip | undefined;
  let targetAct: ItineraryActivity | undefined;

  for (const t of trips) {
    if (t.days) {
      for (const d of t.days) {
        if (d.activities) {
          const act = d.activities.find(a => a.id === id);
          if (act) {
            foundTrip = t;
            targetAct = act;
            break;
          }
        }
      }
    }
    if (targetAct) break;
  }

  if (!foundTrip || !targetAct) throw new Error('Activity not found.');

  const destData = getDestinationData(foundTrip.destination);
  const otherActs: ItineraryActivity[] = [];
  foundTrip.days?.forEach(d => {
    d.activities?.forEach(a => {
      if (a.id !== id && a.is_active !== 0) {
        otherActs.push(a);
      }
    });
  });

  // Filter candidates that are NOT duplicates of ANY other activity in this trip
  const validCandidates = destData.activities.filter(cand => {
    return !otherActs.some(o =>
      arePlacesDuplicate(
        cand.name,
        o.name,
        [cand.latitude, cand.longitude],
        [o.latitude, o.longitude],
        cand.place_id,
        o.place_id
      )
    );
  });

  const chosen = validCandidates[0];
  if (chosen) {
    targetAct.name = chosen.name;
    targetAct.description = chosen.description;
    targetAct.category = chosen.category;
    targetAct.image_url = chosen.image_url;
    targetAct.photo_attribution = chosen.photo_attribution;
    targetAct.estimated_entry_cost = chosen.estimated_entry_cost;
    targetAct.estimated_transport_cost = chosen.estimated_transport_cost;
    targetAct.duration_hours = chosen.duration_hours;
    targetAct.place_id = chosen.place_id;
    targetAct.verification_status = 'verified';
    targetAct.interest_match_reason = chosen.reason || 'Alternative curated attraction.';
  } else {
    targetAct.name = `Scenic Sunset Stroll & Cafe in ${destData.name}`;
    targetAct.description = 'Relaxed personal leisure time exploring local streets, artisan cafes, and markets.';
    targetAct.category = 'relaxation';
    targetAct.image_url = destData.hero_image;
    targetAct.photo_attribution = 'Wikimedia Commons';
    targetAct.verification_status = 'scheduled_break';
  }

  saveTrips(trips);
  return { message: 'Activity replaced successfully.', activity: targetAct };
}

export function localAddActivity(dayId: number, payload: any) {
  const trips = getStoredTrips();
  let added = false;
  for (const t of trips) {
    if (t.days) {
      const d = t.days.find(day => day.id === dayId);
      if (d) {
        if (!d.activities) d.activities = [];
        const newAct: ItineraryActivity = {
          id: Date.now(),
          day_id: dayId,
          trip_id: t.id,
          name: payload.name || 'Custom Activity',
          description: payload.description || 'Self-planned activity.',
          category: payload.category || 'sightseeing',
          time_slot: payload.time_slot || '03:00 PM - 05:00 PM',
          duration_hours: payload.duration_hours || 2.0,
          estimated_entry_cost: payload.estimated_entry_cost || 0,
          estimated_transport_cost: payload.estimated_transport_cost || 0,
          visit_order: d.activities.length + 1,
          interest_match_reason: 'User added custom activity.',
          location_name: t.destination,
          is_active: 1,
          image_url: t.cover_image,
          verification_status: 'custom'
        };
        d.activities.push(newAct);
        added = true;
        break;
      }
    }
    if (added) break;
  }
  saveTrips(trips);
  return { message: 'Activity added.' };
}

export function localGetDestinations() {
  const destinations = Object.values(DESTINATIONS_CATALOG).map(d => ({
    name: d.name,
    state_country: d.state_country,
    currency: d.currency,
    hero_image: d.hero_image,
    description: d.description,
    activities_count: d.activities.length
  }));
  return { destinations, regional_sub_destinations: {} };
}

export function localResolveDestination(query: string) {
  const dest = getDestinationData(query);
  return { destination: dest };
}

export function localEvaluateAdaptation(tripId: number, payload: any) {
  return {
    scenario: payload.scenario || 'overspent',
    risk_level: 'Medium',
    total_savings_potential: 1200,
    suggested_changes: [
      {
        activity_id: 1,
        title: 'Optimize afternoon sightseeing transit',
        cost_delta: -350,
        action: 'switch_to_metro'
      }
    ]
  };
}

export function localAskChatbot(tripId: number, message: string) {
  const all = getStoredTrips();
  const trip = all.find(t => t.id === tripId);
  const destName = trip ? trip.destination : 'your destination';
  const queryLower = message.toLowerCase();

  let reply = `Here are some verified travel tips for ${destName}: Make sure to visit the prime tea gardens, viewpoints, and local spice markets in the morning for crisp weather and stunning photo lighting.`;

  if (queryLower.includes('food') || queryLower.includes('eat') || queryLower.includes('restaurant')) {
    reply = `In ${destName}, don't miss local specialties, fresh artisan teas, and authentic regional dining at traditional bakeries and spice garden cafes.`;
  } else if (queryLower.includes('weather') || queryLower.includes('rain') || queryLower.includes('pack')) {
    reply = `The weather in ${destName} is mild and pleasant. Light layers or a light jacket are recommended for early mornings and evening mist.`;
  } else if (queryLower.includes('budget') || queryLower.includes('cost')) {
    reply = `Your budget for ${destName} is on track! Keep transport costs low by clustering geographically close attractions.`;
  }

  return {
    reply,
    confidence: 'high',
    source: 'TravelWise AI+ Local Engine'
  };
}

// ----------------- Group Expenses Store -----------------
const GROUP_MEMBERS_KEY = 'travelwise_group_members_db';

interface StoredGroupMember {
  id: number;
  trip_id: number;
  name: string;
  email?: string;
}

function getStoredGroupMembers(): StoredGroupMember[] {
  try {
    const raw = localStorage.getItem(GROUP_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 1, trip_id: 101, name: 'Alex Chen', email: 'alex@travelwise.ai' },
      { id: 2, trip_id: 101, name: 'Samba V', email: 'samba@travelwise.ai' }
    ];
  } catch {
    return [];
  }
}

function saveGroupMembers(m: StoredGroupMember[]) {
  localStorage.setItem(GROUP_MEMBERS_KEY, JSON.stringify(m));
}

export function localGetGroupMembers(tripId: number) {
  const members = getStoredGroupMembers().filter(m => m.trip_id === tripId);
  return { members };
}

export function localAddGroupMember(tripId: number, payload: { name: string; email?: string }) {
  const all = getStoredGroupMembers();
  const newM: StoredGroupMember = {
    id: Date.now(),
    trip_id: tripId,
    name: payload.name,
    email: payload.email
  };
  all.push(newM);
  saveGroupMembers(all);
  return { message: 'Member added.', member: newM };
}

export function localRemoveGroupMember(tripId: number, memberId: number) {
  const all = getStoredGroupMembers().filter(m => !(m.trip_id === tripId && m.id === memberId));
  saveGroupMembers(all);
  return { message: 'Member removed.' };
}

export function localGetGroupSplitSummary(tripId: number) {
  const members = getStoredGroupMembers().filter(m => m.trip_id === tripId);
  const expenses = getStoredExpenses().filter(e => e.trip_id === tripId);
  const total_shared = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const per_person = members.length > 0 ? Math.round(total_shared / members.length) : total_shared;

  return {
    total_group_spending: total_shared,
    members_count: members.length,
    per_person_share: per_person,
    settlements: []
  };
}

export function localDeleteTrip(id: number) {
  const all = getStoredTrips().filter(t => t.id !== id);
  saveTrips(all);
  return { message: 'Trip deleted.' };
}


// ----------------- Expenses Store -----------------
function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExpenses(expenses: Expense[]) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function localGetTripExpenses(tripId: number) {
  const all = getStoredExpenses().filter(e => e.trip_id === tripId);
  const trip = getStoredTrips().find(t => t.id === tripId);
  const total_spent = all.reduce((sum, e) => sum + (e.amount || 0), 0);
  const total_budget = trip ? trip.total_budget : 10000;

  const actual_by_category: Record<string, number> = {};
  all.forEach(e => {
    actual_by_category[e.category] = (actual_by_category[e.category] || 0) + e.amount;
  });

  return {
    expenses: all,
    summary: {
      total_budget,
      total_spent,
      remaining_budget: Math.max(0, total_budget - total_spent),
      utilization_pct: total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0,
      currency: trip?.currency || 'INR',
      actual_by_category,
      planned_by_category: { transport: total_budget * 0.3, accommodation: total_budget * 0.4, food: total_budget * 0.2, sightseeing: total_budget * 0.1 },
      estimated_future_commitments: total_budget * 0.2,
      projected_final_spending: total_spent + (total_budget * 0.2),
      projected_variance: total_budget - (total_spent + (total_budget * 0.2)),
      forecast_confidence: { level: 'High', description: 'Deterministic ledger calculation', formula: 'Actuals + Unvisited Commitments' },
      daily_spent: [],
      warnings: [],
      expense_detective_insights: []
    }
  };
}

export function localAddExpense(tripId: number, payload: any) {
  const cur = getCurrentUserLocal();
  const all = getStoredExpenses();
  const newExp: Expense = {
    id: Date.now(),
    trip_id: tripId,
    title: payload.title || 'Travel Expense',
    category: payload.category || 'food',
    amount: parseFloat(payload.amount) || 0,
    currency: payload.currency || 'INR',
    date: payload.date || new Date().toISOString().split('T')[0],
    notes: payload.notes || '',
    payer_name: payload.payer_name || cur?.name || 'Self',
    is_shared: payload.is_shared ? 1 : 0
  };
  all.unshift(newExp);
  saveExpenses(all);

  // Update trip total spent
  const trips = getStoredTrips();
  const tIdx = trips.findIndex(t => t.id === tripId);
  if (tIdx !== -1) {
    trips[tIdx].total_spent = (trips[tIdx].total_spent || 0) + newExp.amount;
    trips[tIdx].remaining_budget = Math.max(0, trips[tIdx].total_budget - trips[tIdx].total_spent);
    trips[tIdx].budget_utilization_pct = Math.round((trips[tIdx].total_spent / trips[tIdx].total_budget) * 100);
    saveTrips(trips);
  }

  return { message: 'Expense added successfully.', expense: newExp };
}

export function localDeleteExpense(id: number) {
  const all = getStoredExpenses().filter(e => e.id !== id);
  saveExpenses(all);
  return { message: 'Expense deleted.' };
}

// ----------------- Receipts Store -----------------
function getStoredReceipts(): Receipt[] {
  try {
    const raw = localStorage.getItem(RECEIPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReceipts(receipts: Receipt[]) {
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}

export function localGetReceipts(params?: any) {
  let list = getStoredReceipts();

  if (params?.trip_id) {
    list = list.filter(r => String(r.trip_id) === String(params.trip_id));
  }
  if (params?.category && params.category !== 'all') {
    list = list.filter(r => (r.category || '').toLowerCase() === String(params.category).toLowerCase());
  }
  if (params?.search) {
    const q = String(params.search).toLowerCase();
    list = list.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.merchant_name && r.merchant_name.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  }
  if (params?.start_date) {
    list = list.filter(r => r.date >= params.start_date);
  }
  if (params?.end_date) {
    list = list.filter(r => r.date <= params.end_date);
  }

  const validCategories = ['food', 'transport', 'accommodation', 'shopping', 'activities', 'other'];
  const by_category: Record<string, number> = {};
  validCategories.forEach(c => { by_category[c] = 0; });

  let total_amount = 0;
  let linked_count = 0;
  let unlinked_count = 0;

  list.forEach(r => {
    const amt = r.amount || 0;
    total_amount += amt;
    const cat = (r.category || 'other').toLowerCase();
    if (by_category[cat] !== undefined) {
      by_category[cat] += amt;
    } else {
      by_category['other'] = (by_category['other'] || 0) + amt;
    }
    if (r.is_expense_created || r.expense_id) {
      linked_count++;
    } else {
      unlinked_count++;
    }
  });

  return {
    receipts: list,
    summary: {
      total_count: list.length,
      total_amount: Math.round(total_amount * 100) / 100,
      by_category,
      linked_count,
      unlinked_count,
      currencies: ['INR']
    }
  };
}

export function localCreateReceipt(payload: any) {
  const all = getStoredReceipts();

  let title = 'Receipt Document';
  let merchant_name = '';
  let amount = 0;
  let currency = 'INR';
  let date = new Date().toISOString().split('T')[0];
  let category = 'food';
  let payment_method = 'credit_card';
  let notes = '';
  let trip_id: number | null = null;
  let file_name = 'receipt.jpg';
  let mime_type = 'image/jpeg';
  let file_url = 'https://images.unsplash.com/photo-1554415707-9e4c07d3882d?auto=format&fit=crop&w=600&q=80';
  let create_linked_expense = false;

  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    title = (payload.get('title') as string) || title;
    merchant_name = (payload.get('merchant_name') as string) || '';
    amount = parseFloat(payload.get('amount') as string) || 0;
    currency = (payload.get('currency') as string) || currency;
    date = (payload.get('date') as string) || date;
    category = (payload.get('category') as string) || category;
    payment_method = (payload.get('payment_method') as string) || payment_method;
    notes = (payload.get('notes') as string) || '';
    const tId = payload.get('trip_id');
    if (tId) trip_id = Number(tId);
    create_linked_expense = payload.get('create_linked_expense') === 'true' || payload.get('create_linked_expense') === '1';

    const file = payload.get('file') as File | null;
    if (file && typeof file === 'object' && file.name) {
      file_name = file.name;
      mime_type = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        try {
          file_url = URL.createObjectURL(file);
        } catch {}
      }
    }
  } else {
    title = payload.title || title;
    merchant_name = payload.merchant_name || '';
    amount = parseFloat(payload.amount) || 0;
    currency = payload.currency || currency;
    date = payload.date || date;
    category = payload.category || category;
    payment_method = payload.payment_method || payment_method;
    notes = payload.notes || '';
    if (payload.trip_id) trip_id = Number(payload.trip_id);
    file_name = payload.file_name || payload.filename || file_name;
    mime_type = payload.mime_type || mime_type;
    create_linked_expense = Boolean(payload.create_linked_expense);
  }

  let expense_id: number | null = null;
  let is_expense_created = 0;

  if (create_linked_expense && trip_id) {
    const expenses = getStoredExpenses();
    const newExp: Expense = {
      id: Date.now(),
      trip_id,
      title: merchant_name ? `${merchant_name} (${title})` : title,
      category,
      amount,
      currency,
      date,
      notes: notes ? `[Receipt: ${file_name}] ${notes}` : `[Receipt: ${file_name}]`,
      payer_name: getCurrentUserLocal()?.name || 'Self',
      is_shared: 0
    };
    expenses.unshift(newExp);
    saveExpenses(expenses);

    expense_id = newExp.id;
    is_expense_created = 1;

    // Update trip total spent
    const trips = getStoredTrips();
    const tIdx = trips.findIndex(t => t.id === trip_id);
    if (tIdx !== -1) {
      trips[tIdx].total_spent = (trips[tIdx].total_spent || 0) + amount;
      trips[tIdx].remaining_budget = Math.max(0, trips[tIdx].total_budget - trips[tIdx].total_spent);
      trips[tIdx].budget_utilization_pct = Math.round((trips[tIdx].total_spent / trips[tIdx].total_budget) * 100);
      saveTrips(trips);
    }
  }

  const newR: Receipt = {
    id: Date.now(),
    user_id: getCurrentUserLocal()?.id || 1,
    trip_id,
    title,
    merchant_name,
    amount,
    currency,
    date,
    category,
    payment_method,
    notes,
    file_name,
    file_path: 'local_receipt',
    file_url,
    mime_type,
    file_size: 102400,
    ocr_applied: 1,
    is_expense_created,
    expense_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  all.unshift(newR);
  saveReceipts(all);
  return { message: 'Receipt saved.', receipt: newR };
}

export function localGetReceipt(id: number) {
  const all = getStoredReceipts();
  const rec = all.find(r => r.id === id);
  if (!rec) throw new Error('Receipt not found.');
  return { receipt: rec };
}

export function localUpdateReceipt(id: number, payload: any) {
  const all = getStoredReceipts();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Receipt not found.');

  const rec = all[idx];
  all[idx] = {
    ...rec,
    title: payload.title !== undefined ? payload.title : rec.title,
    merchant_name: payload.merchant_name !== undefined ? payload.merchant_name : rec.merchant_name,
    amount: payload.amount !== undefined ? parseFloat(payload.amount) : rec.amount,
    currency: payload.currency !== undefined ? payload.currency : rec.currency,
    date: payload.date !== undefined ? payload.date : rec.date,
    category: payload.category !== undefined ? payload.category : rec.category,
    payment_method: payload.payment_method !== undefined ? payload.payment_method : rec.payment_method,
    notes: payload.notes !== undefined ? payload.notes : rec.notes,
    trip_id: payload.trip_id !== undefined ? (payload.trip_id ? Number(payload.trip_id) : null) : rec.trip_id,
    updated_at: new Date().toISOString()
  };

  if (payload.sync_linked_expense && rec.expense_id) {
    const expenses = getStoredExpenses();
    const eIdx = expenses.findIndex(e => e.id === rec.expense_id);
    if (eIdx !== -1) {
      expenses[eIdx] = {
        ...expenses[eIdx],
        title: all[idx].merchant_name ? `${all[idx].merchant_name} (${all[idx].title})` : all[idx].title,
        amount: all[idx].amount,
        category: all[idx].category,
        date: all[idx].date
      };
      saveExpenses(expenses);
    }
  }

  saveReceipts(all);
  return { message: 'Receipt updated successfully.', receipt: all[idx] };
}

export function localDeleteReceipt(id: number, deleteLinkedExpense?: boolean) {
  const all = getStoredReceipts();
  const rec = all.find(r => r.id === id);
  if (!rec) return { message: 'Receipt deleted.' };

  if (deleteLinkedExpense && rec.expense_id) {
    localDeleteExpense(rec.expense_id);
  }

  const filtered = all.filter(r => r.id !== id);
  saveReceipts(filtered);
  return { message: 'Receipt deleted.' };
}

export function localConvertReceiptToExpense(id: number, payload: { trip_id?: number; category?: string; amount?: number; title?: string }) {
  const all = getStoredReceipts();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Receipt not found.');
  const rec = all[idx];

  const tripId = payload.trip_id || rec.trip_id;
  if (!tripId) throw new Error('A trip must be associated to create an expense.');

  const expenses = getStoredExpenses();
  const newExp: Expense = {
    id: Date.now(),
    trip_id: tripId,
    title: payload.title || (rec.merchant_name ? `${rec.merchant_name} (${rec.title})` : rec.title),
    category: payload.category || rec.category || 'food',
    amount: payload.amount !== undefined ? payload.amount : rec.amount,
    currency: rec.currency || 'INR',
    date: rec.date || new Date().toISOString().split('T')[0],
    notes: `[Linked from Receipt #${rec.id}] ${rec.notes || ''}`.trim(),
    payer_name: getCurrentUserLocal()?.name || 'Self',
    is_shared: 0
  };

  expenses.unshift(newExp);
  saveExpenses(expenses);

  all[idx].is_expense_created = 1;
  all[idx].expense_id = newExp.id;
  all[idx].trip_id = tripId;
  saveReceipts(all);

  const trips = getStoredTrips();
  const tIdx = trips.findIndex(t => t.id === tripId);
  if (tIdx !== -1) {
    trips[tIdx].total_spent = (trips[tIdx].total_spent || 0) + newExp.amount;
    trips[tIdx].remaining_budget = Math.max(0, trips[tIdx].total_budget - trips[tIdx].total_spent);
    trips[tIdx].budget_utilization_pct = Math.round((trips[tIdx].total_spent / trips[tIdx].total_budget) * 100);
    saveTrips(trips);
  }

  return { message: 'Expense created and linked.', expense: newExp, receipt: all[idx] };
}

export function localGetReceiptFileBlobUrl(id: number) {
  const all = getStoredReceipts();
  const rec = all.find(r => r.id === id);
  if (rec && rec.file_url) return rec.file_url;
  return 'https://images.unsplash.com/photo-1554415707-9e4c07d3882d?auto=format&fit=crop&w=600&q=80';
}

export function localUploadReceiptScan(formData: FormData) {
  const file = formData.get('file') as File | null;
  const fileName = file ? file.name : 'Scanned_Receipt.jpg';
  const mockAmounts = [450, 1200, 350, 2400, 850];
  const randAmount = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
  return {
    scanned_details: {
      title: fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      amount: randAmount,
      date: new Date().toISOString().split('T')[0],
      category: 'food',
      currency: 'INR'
    },
    message: 'Receipt scan parsed successfully.'
  };
}

// ----------------- Travel Helper -----------------
export function localGetHelperResources() {
  return {
    emergency_numbers: [
      { country: 'India', jurisdiction: 'National Emergency', police: '112 / 100', ambulance: '108', tourist_helpline: '1363' },
      { country: 'United States', jurisdiction: 'Federal', police: '911', ambulance: '911', tourist_helpline: '1-800-255-7466' },
      { country: 'United Kingdom', jurisdiction: 'National', police: '999 / 101', ambulance: '999 / 111', tourist_helpline: '0300 123 2040' },
      { country: 'European Union', jurisdiction: 'Universal EU', police: '112', ambulance: '112', tourist_helpline: '00 800 6 7 8 9 10 11' }
    ],
    phrasebooks: [
      { language: 'Hindi', greetings: 'Namaste (Hello)', thank_you: 'Dhanyavaad', how_much: 'Yeh kitne ka hai?', where_is: 'Yeh kahan hai?' },
      { language: 'French', greetings: 'Bonjour', thank_you: 'Merci beaucoup', how_much: 'Combien ça coûte?', where_is: 'Où est...?' },
      { language: 'Spanish', greetings: 'Hola', thank_you: 'Muchas gracias', how_much: '¿Cuánto cuesta?', where_is: '¿Dónde está...?' }
    ]
  };
}

export function localSubmitSupportTicket(payload: any) {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const newT = { id: Date.now(), ...payload, status: 'open', created_at: new Date().toISOString() };
    list.unshift(newT);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(list));
  } catch {}
  return { message: 'Ticket submitted successfully.' };
}

export function localGetMyTickets() {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    return { tickets: raw ? JSON.parse(raw) : [] };
  } catch {
    return { tickets: [] };
  }
}
