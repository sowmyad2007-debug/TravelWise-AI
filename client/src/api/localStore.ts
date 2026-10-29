import { User, Trip, ItineraryDay, ItineraryActivity, Expense, Receipt } from '../types';

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

  const destination = payload.destination || 'Hyderabad';
  const start_date = payload.start_date || new Date().toISOString().split('T')[0];
  const end_date = payload.end_date || start_date;
  
  const d1 = new Date(start_date);
  const d2 = new Date(end_date);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const newTripId = Date.now();
  const days: ItineraryDay[] = [];

  for (let i = 1; i <= diffDays; i++) {
    const curDate = new Date(d1);
    curDate.setDate(curDate.getDate() + (i - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    const acts: ItineraryActivity[] = [
      {
        id: newTripId * 10 + i * 2,
        day_id: i,
        trip_id: newTripId,
        name: i === 1 ? `Historic Landmarks of ${destination}` : `Cultural Discovery (Day ${i})`,
        description: `Explore prime attractions and authentic cultural spots in ${destination}.`,
        category: 'sightseeing',
        time_slot: '09:30 AM - 12:30 PM',
        duration_hours: 3,
        estimated_entry_cost: 100,
        estimated_transport_cost: 50,
        visit_order: 1,
        interest_match_reason: 'Top verified attraction for your itinerary.',
        location_name: destination,
        is_active: 1,
        image_url: DESTINATION_PHOTOS[destination] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        match_score: 92
      },
      {
        id: newTripId * 10 + i * 2 + 1,
        day_id: i,
        trip_id: newTripId,
        name: `Scenic Leisure & Local Dining in ${destination}`,
        description: `Enjoy local cuisine, artisan markets, and picturesque viewpoints.`,
        category: 'food',
        time_slot: '03:30 PM - 06:00 PM',
        duration_hours: 2.5,
        estimated_entry_cost: 50,
        estimated_transport_cost: 40,
        visit_order: 2,
        interest_match_reason: 'Curated dining and leisure experience.',
        location_name: `${destination} City Center`,
        is_active: 1,
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        match_score: 88
      }
    ];

    days.push({
      id: i,
      trip_id: newTripId,
      day_number: i,
      date: dateStr,
      title: `Day ${i} ${destination} Discovery`,
      activities: acts
    });
  }

  const newTrip: Trip = {
    id: newTripId,
    user_id: cur.id,
    title: payload.title || `${destination} Travel Experience`,
    starting_city: payload.starting_city || 'Home City',
    destination,
    start_date,
    end_date,
    travelers: payload.travelers || 1,
    total_budget: payload.total_budget || 10000,
    currency: payload.currency || 'INR',
    travel_style: payload.travel_style || 'balanced',
    interests: Array.isArray(payload.interests) ? payload.interests : ['nature', 'culture'],
    accommodation_pref: payload.accommodation_pref || 'budget_hotel',
    dietary_pref: payload.dietary_pref || 'no_preference',
    accessibility_pref: payload.accessibility_pref || 'standard',
    cover_image: DESTINATION_PHOTOS[destination] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
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
    list = list.filter(r => r.trip_id === params.trip_id);
  }
  const total_amount = list.reduce((s, r) => s + (r.amount || 0), 0);
  return {
    receipts: list,
    summary: {
      total_count: list.length,
      total_amount,
      currency: 'INR'
    }
  };
}

export function localCreateReceipt(payload: any) {
  const all = getStoredReceipts();
  const newR: Receipt = {
    id: Date.now(),
    user_id: getCurrentUserLocal()?.id || 1,
    trip_id: payload.trip_id || null,
    title: payload.title || 'Receipt Document',
    amount: parseFloat(payload.amount) || 0,
    currency: payload.currency || 'INR',
    date: payload.date || new Date().toISOString().split('T')[0],
    category: payload.category || 'food',
    payment_method: payload.payment_method || 'card',
    notes: payload.notes || '',
    file_name: payload.filename || payload.file_name || 'receipt.jpg',
    file_path: 'local_receipt',
    file_url: 'https://images.unsplash.com/photo-1554415707-9e4c07d3882d?auto=format&fit=crop&w=600&q=80',
    mime_type: payload.mime_type || 'image/jpeg',
    file_size: 102400,
    ocr_applied: 1,
    is_expense_created: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  all.unshift(newR);
  saveReceipts(all);
  return { message: 'Receipt saved.', receipt: newR };
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
