
import { supabase } from '@/integrations/supabase/client';
import { type Event } from '@/integrations/supabase/types';

export const getEvents = async ({
  limit,
  offset,
  searchText,
  filter,
}: {
  limit: number;
  offset: number;
  searchText?: string;
  filter?: string;
}) => {
  const { data, error } = await supabase.rpc('get_events_with_details', {
    p_limit: limit,
    p_offset: offset,
    p_search_text: searchText,
    p_filter: filter,
  });

  if (error) {
    console.error('Error fetching events:', error);
    return { events: [], count: 0 };
  }

  // The RPC function returns a list of events, but not the total count.
  // We need to make a separate query to get the total count for pagination.
  const { count, error: countError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .ilike('name', `%${searchText || ''}%`);

  if (countError) {
    console.error('Error fetching event count:', countError);
  }

  return { events: data as Event[], count: count || 0 };
};

export const getEventById = async (id: string) => {
  const { data, error } = await supabase
    .rpc('get_events_with_details', {
      p_limit: 1,
      p_offset: 0,
    })
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data as Event;
};

export const getMyEvents = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_events_with_details', {
    p_limit: 100, // Adjust as needed
    p_offset: 0,
  });

  if (error) {
    console.error('Error fetching my events:', error);
    return { hosting: [], attending: [] };
  }

  const events = data as Event[];
  const hosting = events.filter((event) => event.host_id === userId);
  const attending = events.filter((event) => event.host_id !== userId); // This is not correct, we need to check event_registrations

  // We need to fix the attending logic
  const { data: registrations, error: registrationError } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);

  if (registrationError) {
    console.error('Error fetching event registrations:', registrationError);
    return { hosting, attending: [] };
    }

    const attendingEventIds = registrations.map((r) => r.event_id);
    const attendingEvents = events.filter((event) => attendingEventIds.includes(event.id));


  return { hosting, attending: attendingEvents };
};
