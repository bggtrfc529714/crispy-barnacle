import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Star, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import { getEventById } from "@/lib/events";
import { type Event } from "@/integrations/supabase/types";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      const eventData = await getEventById(id);
      if (eventData) {
        setEvent(eventData);
      } else {
        toast.error("Failed to load event");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const checkRegistration = useCallback(async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsRegistered(!!data);
  }, [id]);

  useEffect(() => {
    fetchEvent();
    checkRegistration();
  }, [fetchEvent, checkRegistration]);

  const handleRegistration = async () => {
    setIsRegistering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isRegistered) {
        const { error } = await supabase
          .from("event_registrations")
          .delete()
          .eq("event_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsRegistered(false);
        setEvent(prev => prev ? { ...prev, registration_count: prev.registration_count - 1 } : null);
        toast.success("Unregistered from event");
      } else {
        const { error } = await supabase.from("event_registrations").insert({
          event_id: id!,
          user_id: user.id,
        });

        if (error) throw error;
        setIsRegistered(true);
        setEvent(prev => prev ? { ...prev, registration_count: prev.registration_count + 1 } : null);
        toast.success("Registered for event!");
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to update registration");
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const isFull = event.registration_count >= event.capacity;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative h-64">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-primary" />
        )}
        <div className="absolute inset-0 gradient-overlay" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/80 backdrop-blur hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Badge className="absolute top-4 right-4 bg-card text-card-foreground">
          {event.category}
        </Badge>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        <Card className="p-6 space-y-6 shadow-elevated">
          <div>
            <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {format(new Date(event.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">{event.location}</span>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {event.registration_count} / {event.capacity} registered
              </span>
              {isFull && (
                <Badge variant="destructive" className="ml-auto">
                  Full
                </Badge>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Hosted by</h3>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {event.host_profile?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{event.host_profile?.full_name}</p>
              </div>
              {event.host_rating && (
                <div className="flex items-center gap-1 bg-secondary/10 px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="font-semibold text-secondary">
                    {event.host_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleRegistration}
            disabled={isRegistering || (!isRegistered && isFull)}
            className="w-full h-12 text-base font-semibold"
            variant={isRegistered ? "outline" : "default"}
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : isRegistered ? (
              "Unregister"
            ) : isFull ? (
              "Event Full"
            ) : (
              "Register for Event"
            )}
          </Button>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default EventDetail;
