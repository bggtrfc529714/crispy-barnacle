import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { getEvents } from "@/lib/events";
import { type Event } from "@/integrations/supabase/types";

const Home = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  }, [navigate]);

  const loadEvents = useCallback(async (reset = false) => {
    setIsLoading(true);
    const { events: newEvents, count } = await getEvents({
      limit: 10,
      offset: reset ? 0 : page * 10,
      searchText: searchQuery,
      filter: filter,
    });

    setEvents(prev => reset ? newEvents : [...prev, ...newEvents]);
    setHasMore(count > (reset ? newEvents.length : events.length + newEvents.length));
    if (reset) setPage(1);
    else setPage(prev => prev + 1);

    setIsLoading(false);
  }, [page, searchQuery, filter, events.length]);

  useEffect(() => {
    checkAuth();
    loadEvents(true);
  }, [checkAuth, searchQuery, filter]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-primary text-primary-foreground p-6 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Discover Events</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card text-foreground border-0"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Filter by</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={filter}
              onValueChange={(value) => setFilter(value)}
              className="flex-wrap justify-start"
            >
              <ToggleGroupItem value="upcoming">Upcoming</ToggleGroupItem>
              <ToggleGroupItem value="past">Past</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {isLoading && events.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events found</p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))
          )}
          {hasMore && !isLoading && (
            <Button onClick={() => loadEvents()} className="w-full">
              Load More
            </Button>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Home;
