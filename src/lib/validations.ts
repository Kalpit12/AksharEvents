import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["ATTENDEE", "ORGANIZER"]).default("ATTENDEE"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const exhibitorRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  eventId: z.string().min(1, "Select the event you are exhibiting at"),
  companyName: z.string().min(2, "Company name is required"),
  products: z.string().min(3, "List at least one product or service"),
  description: z.string().optional(),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "Enter a valid website URL",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  venueId: z.string().optional(),
  format: z.enum([
    "EXPO", "CONFERENCE", "JOB_FAIR", "CAREER_EVENT", "UNIVERSITY_EVENT",
    "TECHNOLOGY", "HEALTHCARE", "WORKSHOP", "NETWORKING", "COMMUNITY", "OTHER",
  ]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  capacity: z.coerce.number().positive().optional(),
  terms: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ticketTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tier: z.enum(["FREE", "PAID", "VIP", "GROUP"]),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().positive(),
  minPerOrder: z.coerce.number().min(1).default(1),
  maxPerOrder: z.coerce.number().min(1).default(10),
});

export const bookingSchema = z.object({
  eventId: z.string(),
  items: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.coerce.number().min(1),
  })).min(1),
  attendeeName: z.string().min(2),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  couponCode: z.string().optional(),
});

export const reviewSchema = z.object({
  eventId: z.string(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const bookingInquirySchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  expectedAttendees: z.coerce.number().positive("Enter a valid number of attendees"),
  additionalServices: z.array(z.string()).optional(),
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().optional(),
  organization: z.string().min(2, "Organization is required"),
  country: z.string().min(1, "Country is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export const couponSchema = z.object({
  code: z.string().min(3).max(20),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive(),
  maxUses: z.coerce.number().positive().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  expiresAt: z.string().optional(),
});

export const addExhibitorMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Enter a valid phone number"),
  memberRole: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

export const exhibitorMemberCsvRowSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Enter a valid phone number"),
});

export const bookActivitySchema = z.object({
  activityId: z.string().min(1),
  eventSlug: z.string().min(1),
  notes: z.string().optional(),
});

export const itineraryItemSchema = z.object({
  eventSlug: z.string().min(1),
  title: z.string().min(2, "Title is required"),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  assignedMemberId: z.string().optional(),
});

export const createActivitySchema = z.object({
  eventId: z.string().min(1),
  kind: z.enum(["TOUR", "TRAVEL"]),
  travelType: z.enum(["SHUTTLE", "FLIGHT", "HOTEL", "TRANSFER", "OTHER"]).optional(),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().optional(),
  location: z.string().optional(),
  maxSlots: z.coerce.number().positive().optional(),
  price: z.coerce.number().min(0).default(0),
});

export const createEventHotelSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(2, "Hotel name is required"),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const createEventRestaurantSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(2, "Restaurant name is required"),
  cuisine: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const createEventScheduleItemSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().optional(),
  location: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ExhibitorRegisterInput = z.infer<typeof exhibitorRegisterSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BookingInquiryInput = z.infer<typeof bookingInquirySchema>;
