/**
 * OpenAPI 3.1 spec for the AxarEvents Developer Gateway.
 * Served at /openapi.json and rendered by Swagger UI at /docs.
 */
export function getDeveloperOpenApiSpec(baseUrl?: string) {
  void baseUrl;

  return {
    openapi: "3.1.0",
    info: {
      title: "AxarEvents Developer Gateway",
      version: "1.0.0",
    },
    tags: [
      { name: "Health", description: "Gateway status" },
      {
        name: "Events",
        description: "Published event data scoped to your API key",
      },
      {
        name: "Bookings",
        description: "Realtime booking / attendee data for an event",
      },
      {
        name: "Stats",
        description: "Live ticket and check-in aggregates",
      },
      {
        name: "Check-in",
        description: "Verify and check in attendees by booking number",
      },
      {
        name: "Admin & Client Management",
        description: "Create API keys and view usage",
      },
    ],
    paths: {
      "/api/v1": {
        get: {
          tags: ["Health"],
          summary: "Health Check",
          operationId: "health_check",
          responses: {
            "200": {
              description: "Gateway is online",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/events": {
        get: {
          tags: ["Events"],
          summary: "List Events",
          description:
            "List published events visible to this API key. Event-scoped keys return only that event.",
          operationId: "list_events",
          security: [{ APIKeyHeader: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0, minimum: 0 },
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/EventListResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/v1/events/{slug}": {
        get: {
          tags: ["Events"],
          summary: "Get Event By Slug",
          description: "Fetch a single published event with ticket types.",
          operationId: "get_event_by_slug",
          security: [{ APIKeyHeader: [] }],
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/EventDetail" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/v1/events/{slug}/bookings": {
        get: {
          tags: ["Bookings"],
          summary: "List Event Bookings",
          description:
            "Realtime confirmed (and optionally all) bookings for an event.",
          operationId: "list_event_bookings",
          security: [{ APIKeyHeader: [] }],
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 50, minimum: 1, maximum: 200 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0, minimum: 0 },
            },
            {
              name: "status",
              in: "query",
              required: false,
              description: "Filter by booking status. Default: CONFIRMED",
              schema: {
                type: "string",
                enum: ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED", "ALL"],
                default: "CONFIRMED",
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/BookingListResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/v1/events/{slug}/stats": {
        get: {
          tags: ["Stats"],
          summary: "Get Event Live Stats",
          description:
            "Ticket sold counts, check-ins, and revenue summary for the event.",
          operationId: "get_event_stats",
          security: [{ APIKeyHeader: [] }],
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/EventStats" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/v1/events/{slug}/check-in": {
        post: {
          tags: ["Check-in"],
          summary: "Check In Attendee",
          description:
            "Verify a booking number and mark the attendee as checked in.",
          operationId: "check_in_attendee",
          security: [{ APIKeyHeader: [] }],
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckInRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckInResponse" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/v1/admin/generate-key": {
        post: {
          tags: ["Admin & Client Management"],
          summary: "Generate New Client Key",
          description:
            "Creates a new API key. Authenticate with `AXAR_API_ADMIN_KEY` in the `API-Key` header. The full key is returned **once**.",
          operationId: "generate_api_key",
          security: [{ APIKeyHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateApiKeyRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateApiKeyResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "422": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/v1/admin/usage-report": {
        get: {
          tags: ["Admin & Client Management"],
          summary: "Get Usage Report",
          description: "Aggregates request counts per API key for billing/monitoring.",
          operationId: "get_usage_report",
          security: [{ APIKeyHeader: [] }],
          responses: {
            "200": {
              description: "Successful Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UsageReport" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        APIKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "API-Key",
          description:
            "Provide a valid client API key (from generate-key) or AXAR_API_ADMIN_KEY for admin routes.",
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid API key",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "API key lacks scope or event access",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        BadRequest: {
          description: "Validation or business rule error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "online" },
            gateway: {
              type: "string",
              example: "AxarEvents Developer Gateway",
            },
            version: { type: "string", example: "1.0.0" },
            docs: { type: "string", example: "/docs" },
          },
          required: ["status", "gateway"],
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
            status: { type: "string", example: "error" },
          },
          required: ["error"],
        },
        TicketTypeSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            tier: { type: "string" },
            price: { type: "number" },
            currency: { type: "string" },
            quantity: { type: "integer" },
            sold: { type: "integer" },
            isActive: { type: "boolean" },
          },
        },
        EventSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            format: { type: "string" },
            status: { type: "string" },
            shortDescription: { type: ["string", "null"] },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            category: { type: ["string", "null"] },
            venue: { type: ["string", "null"] },
            city: { type: ["string", "null"] },
            banner: { type: ["string", "null"] },
            priceFrom: { type: "number" },
          },
        },
        EventDetail: {
          allOf: [
            { $ref: "#/components/schemas/EventSummary" },
            {
              type: "object",
              properties: {
                description: { type: "string" },
                capacity: { type: ["integer", "null"] },
                ticketTypes: {
                  type: "array",
                  items: { $ref: "#/components/schemas/TicketTypeSummary" },
                },
              },
            },
          ],
        },
        EventListResponse: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: { $ref: "#/components/schemas/EventSummary" },
            },
            total: { type: "integer" },
          },
          required: ["events", "total"],
        },
        BookingItem: {
          type: "object",
          properties: {
            ticketType: { type: "string" },
            quantity: { type: "integer" },
            unitPrice: { type: "number" },
            subtotal: { type: "number" },
          },
        },
        BookingRecord: {
          type: "object",
          properties: {
            bookingNumber: { type: "string" },
            status: { type: "string" },
            attendeeName: { type: "string" },
            attendeeEmail: { type: "string" },
            attendeePhone: { type: ["string", "null"] },
            attendeeCompany: { type: ["string", "null"] },
            totalAmount: { type: "number" },
            currency: { type: "string" },
            checkedIn: { type: "boolean" },
            checkedInAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/BookingItem" },
            },
          },
        },
        BookingListResponse: {
          type: "object",
          properties: {
            event: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
              },
            },
            bookings: {
              type: "array",
              items: { $ref: "#/components/schemas/BookingRecord" },
            },
            total: { type: "integer" },
          },
        },
        EventStats: {
          type: "object",
          properties: {
            event: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
              },
            },
            bookings: {
              type: "object",
              properties: {
                confirmed: { type: "integer" },
                pending: { type: "integer" },
                cancelled: { type: "integer" },
                checkedIn: { type: "integer" },
              },
            },
            tickets: {
              type: "object",
              properties: {
                capacity: { type: "integer" },
                sold: { type: "integer" },
                remaining: { type: "integer" },
              },
            },
            revenue: {
              type: "object",
              properties: {
                currency: { type: "string" },
                confirmedTotal: { type: "number" },
              },
            },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CheckInRequest: {
          type: "object",
          required: ["bookingNumber"],
          properties: {
            bookingNumber: {
              type: "string",
              description: "Unique booking / ticket number",
              example: "AXR-ABC123",
            },
          },
        },
        CheckInResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            alreadyCheckedIn: { type: "boolean" },
            attendeeName: { type: "string" },
            bookingNumber: { type: "string" },
            eventTitle: { type: "string" },
            checkedInAt: { type: "string", format: "date-time" },
          },
        },
        CreateApiKeyRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Client / integration name",
              example: "Partner Scanner App",
            },
            eventId: {
              type: ["string", "null"],
              description:
                "Optional event id to scope the key. Omit for platform-wide access.",
            },
            rateLimit: {
              type: "integer",
              default: 60,
              description: "Max requests per minute",
            },
            scopes: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "events:read",
                  "bookings:read",
                  "stats:read",
                  "checkin:write",
                ],
              },
              description: "Defaults to all scopes if omitted",
            },
          },
        },
        CreateApiKeyResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            keyPrefix: { type: "string" },
            apiKey: {
              type: "string",
              description: "Full secret — shown only once",
            },
            eventId: { type: ["string", "null"] },
            rateLimit: { type: "integer" },
            scopes: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        UsageReport: {
          type: "object",
          properties: {
            generatedAt: { type: "string", format: "date-time" },
            keys: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  keyPrefix: { type: "string" },
                  eventId: { type: ["string", "null"] },
                  requestCount: { type: "integer" },
                  lastUsedAt: {
                    type: ["string", "null"],
                    format: "date-time",
                  },
                  isActive: { type: "boolean" },
                  recentRequests: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
  } as const;
}
