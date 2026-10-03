export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Gym Management API Documentation',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for Gym Management featuring Fixed-Duration Passes, Class & Trainer Booking, Admin Dashboard Analytics, and an Idempotent Mock Payment Gateway.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base URL',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['MEMBER', 'TRAINER', 'ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MembershipPlan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: '3-Months Pro Pass' },
          description: { type: 'string' },
          durationInDays: { type: 'integer', example: 90 },
          price: { type: 'number', example: 129.0 },
          isActive: { type: 'boolean', example: true },
          features: {
            type: 'array',
            items: { type: 'string' },
            example: ['Full gym floor access', 'Unlimited group classes'],
          },
        },
      },
      PassPurchase: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          planId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'] },
          amountPaid: { type: 'number', example: 129.0 },
        },
      },
      Class: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trainerId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'High Intensity Morning Blast' },
          description: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          capacity: { type: 'integer', example: 20 },
          bookedSpots: { type: 'integer', example: 5 },
          availableSpots: { type: 'integer', example: 15 },
          status: { type: 'string', enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 45 },
              totalPages: { type: 'integer', example: 3 },
            },
          },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
              requestId: { type: 'string', example: 'd3b07384-d113-46fb-a0f5-48b479261a84' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'Member registration, login, token refresh, and logout' },
    { name: 'User Profile', description: 'Personal details, active membership passes, and bookings' },
    { name: 'Membership Plans', description: 'Explore available fixed-duration gym passes' },
    { name: 'Checkout & Payments', description: 'Pass purchases, mock sandbox payment execution, and receipts' },
    { name: 'Classes & Bookings', description: 'Group fitness classes, schedules, and reservations' },
    { name: 'Admin Dashboard', description: 'Executive analytics, member roster, plans, classes, and revenue ledger' },
  ],
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new member',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'member@example.com' },
                  password: { type: 'string', minLength: 8, example: 'StrongP@ss123' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  phone: { type: 'string', example: '+15551234567' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Member created successfully' },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log into an existing account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@gym.com' },
                  password: { type: 'string', example: 'AdminPassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate refresh token and issue new access token',
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out and invalidate cookie session',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['User Profile'],
        summary: 'Retrieve authenticated user profile and active pass',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profile details' },
          401: { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['User Profile'],
        summary: 'Update member profile details',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
        },
      },
    },
    '/users/me/membership': {
      get: {
        tags: ['User Profile'],
        summary: 'View pass purchase history and expiration dates',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Membership history list' },
        },
      },
    },
    '/users/me/bookings': {
      get: {
        tags: ['User Profile'],
        summary: 'View upcoming and past class bookings',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Member bookings list' },
        },
      },
    },
    '/plans': {
      get: {
        tags: ['Membership Plans'],
        summary: 'List all active membership passes',
        responses: {
          200: { description: 'List of active plans' },
        },
      },
    },
    '/plans/{id}': {
      get: {
        tags: ['Membership Plans'],
        summary: 'Get details of a specific plan',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Plan details' },
          404: { description: 'Plan not found' },
        },
      },
    },
    '/checkout/create-intent': {
      post: {
        tags: ['Checkout & Payments'],
        summary: 'Initialize pass purchase and generate pending order',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId'],
                properties: {
                  planId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Payment intent created' },
        },
      },
    },
    '/checkout/mock-pay': {
      post: {
        tags: ['Checkout & Payments'],
        summary: 'Simulate sandbox card payment execution',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paymentId'],
                properties: {
                  paymentId: { type: 'string', format: 'uuid' },
                  simulateOutcome: { type: 'string', enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
                  paymentMethod: { type: 'string', enum: ['MOCK_CARD', 'MOCK_UPI', 'MOCK_NETBANKING'], default: 'MOCK_CARD' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment simulation result' },
        },
      },
    },
    '/checkout/receipt/{paymentId}': {
      get: {
        tags: ['Checkout & Payments'],
        summary: 'Retrieve payment receipt and confirmation',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'paymentId', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Verified receipt' },
          404: { description: 'Receipt not found' },
        },
      },
    },
    '/classes': {
      get: {
        tags: ['Classes & Bookings'],
        summary: 'Explore upcoming group workout sessions and spot availability',
        parameters: [
          { in: 'query', name: 'trainerId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'] } },
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Upcoming classes' },
        },
      },
    },
    '/classes/{id}': {
      get: {
        tags: ['Classes & Bookings'],
        summary: 'Get class details and spot counts',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Class info' },
        },
      },
    },
    '/classes/{id}/book': {
      post: {
        tags: ['Classes & Bookings'],
        summary: 'Book a spot in a class (Requires active pass & available capacity)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          201: { description: 'Booking confirmed' },
          403: { description: 'No active pass' },
          409: { description: 'Class full or already booked' },
        },
      },
      delete: {
        tags: ['Classes & Bookings'],
        summary: 'Cancel an existing class booking',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Booking cancelled' },
        },
      },
    },
    '/admin/analytics/overview': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Get dashboard KPIs (active members, monthly revenue, upcoming classes)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Analytics overview' },
          403: { description: 'Forbidden - requires ADMIN role' },
        },
      },
    },
    '/admin/members': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Paginated member roster with search and pass status filter',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Members list with metadata' },
        },
      },
    },
    '/admin/members/{id}/status': {
      patch: {
        tags: ['Admin Dashboard'],
        summary: 'Suspend or activate a member account',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Account status updated' },
        },
      },
    },
    '/admin/plans': {
      post: {
        tags: ['Admin Dashboard'],
        summary: 'Create a new membership pass tier',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MembershipPlan' },
            },
          },
        },
        responses: {
          201: { description: 'Plan created' },
        },
      },
    },
    '/admin/classes': {
      post: {
        tags: ['Admin Dashboard'],
        summary: 'Schedule a new group fitness class',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['trainerId', 'title', 'startTime', 'endTime', 'capacity'],
                properties: {
                  trainerId: { type: 'string', format: 'uuid' },
                  title: { type: 'string', example: 'Crossfit Power Hour' },
                  description: { type: 'string' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  capacity: { type: 'integer', example: 25 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Class scheduled' },
        },
      },
    },
    '/admin/payments': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'View complete transaction and revenue ledger',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] } },
          { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Payment transactions list' },
        },
      },
    },
  },
};
