export type EventHotelOption = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type EventRestaurantOption = {
  id: string;
  name: string;
  cuisine: string | null;
  location: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type EventScheduleItemOption = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  isActive: boolean;
  sortOrder: number;
};

export function serializeEventHotel(hotel: {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}): EventHotelOption {
  return {
    id: hotel.id,
    name: hotel.name,
    location: hotel.location,
    description: hotel.description,
    isActive: hotel.isActive,
    sortOrder: hotel.sortOrder,
  };
}

export function serializeEventRestaurant(restaurant: {
  id: string;
  name: string;
  cuisine: string | null;
  location: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}): EventRestaurantOption {
  return {
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    location: restaurant.location,
    description: restaurant.description,
    isActive: restaurant.isActive,
    sortOrder: restaurant.sortOrder,
  };
}

export function serializeEventScheduleItem(item: {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  isActive: boolean;
  sortOrder: number;
}): EventScheduleItemOption {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt?.toISOString() ?? null,
    location: item.location,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  };
}
