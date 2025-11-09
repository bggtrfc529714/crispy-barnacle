import { Calendar, MapPin, Users, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { type Event } from "@/integrations/supabase/types";

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const {
    id,
    name,
    description,
    date,
    location,
    category,
    capacity,
    image_url,
    host_profile,
    host_rating,
    registration_count,
  } = event;

  return (
    <Link to={`/event/${id}`}>
      <Card className="overflow-hidden shadow-card hover:shadow-elevated transition-smooth cursor-pointer">
        <div className="relative h-48 bg-gradient-primary">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <Calendar className="h-16 w-16 text-primary-foreground opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 gradient-overlay" />
          <Badge className="absolute top-3 right-3 bg-card text-card-foreground">
            {category}
          </Badge>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">{name}</h3>
            {host_rating && (
              <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="text-sm font-semibold text-secondary">
                  {host_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(date), "MMM d, yyyy • h:mm a")}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{location}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {registration_count} / {capacity} registered
                </span>
              </div>
              <span className="text-xs text-muted-foreground">by {host_profile.full_name}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;
