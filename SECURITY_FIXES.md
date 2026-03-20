# 🔐 SECURITY FIXES - Implementation Guide

## Critical Issue #1: JWT-Based Authentication

### Problem
Current auth only checks if `auth_session` cookie exists. Anyone can open DevTools console and run:
```javascript
document.cookie = "auth_session=true";
window.location.href = "/admin";
```

### Solution: Implement JWT Sessions

**Step 1: Install dependencies**
```bash
npm install jose
```

**Step 2: Create auth utilities**

```typescript
// src/lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-me'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export async function generateJWT(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as JWTPayload;
  } catch (err) {
    return null;
  }
}
```

**Step 3: Update middleware**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

const publicRoutes = ['/login', '/signup', '/forgot-password'];
const protectedRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Get JWT token from cookies
  const token = request.cookies.get('session_token')?.value;
  const payload = token ? await verifyJWT(token) : null;

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup
  if ((pathname === '/login' || pathname === '/signup') && payload) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Add user info to request headers for server components/actions
  if (payload) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Step 4: Update login action**

```typescript
// src/app/(actions)/auth.ts
'use server';

import { generateJWT } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function loginAdmin(email: string, password: string) {
  try {
    // Validate input
    if (!email || !password) {
      return { success: false, error: 'Email and password required' };
    }

    // TODO: Replace with your actual Appwrite auth
    // This is just an example
    const user = {
      userId: 'admin-123',
      email: email,
      role: 'admin' as const,
    };

    // Generate JWT token
    const token = await generateJWT(user);

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  return { success: true };
}
```

---

## Critical Issue #2: Authenticate API Endpoints

### Problem
`/api/admin/users` has ZERO authentication. Anyone can call it.

### Solution: Add auth middleware

```typescript
// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

export async function requireAuth(
  request: NextRequest,
  requiredRole?: 'admin' | 'user'
) {
  const token = request.cookies.get('session_token')?.value;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (requiredRole && payload.role !== requiredRole) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    payload,
  };
}
```

```typescript
// src/app/api/admin/users/route.ts - UPDATED
import { requireAuth } from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';

export async function GET(request: NextRequest) {
  // ✅ NEW: Require authentication + admin role
  const auth = await requireAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET!);

    const users = new Users(client);
    const response = await users.list();

    return NextResponse.json({
      success: true,
      users: response.users.map((user: any) => ({
        id: user.$id,
        email: user.email,
        name: user.name,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
```

---

## Critical Issue #3: Input Validation

### Problem
No validation - user input goes directly to database

### Solution: Add Zod schemas

```bash
npm install zod
```

```typescript
// src/lib/validation/employee.ts
import { z } from 'zod';

const AttendanceStatusEnum = z.enum(['P', 'A', 'L', 'H', 'WO', 'HO', '-']);

const DaySchema = z.record(z.string(), AttendanceStatusEnum.optional());

export const EmployeeUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  employeeId: z.string().min(1).max(20).optional(),
  ctc: z.number().positive().optional(),
  designation: z.string().max(100).optional(),
  
  // Daily attendance fields
  '1Sun': AttendanceStatusEnum.optional(),
  '2Mon': AttendanceStatusEnum.optional(),
  '3Tue': AttendanceStatusEnum.optional(),
  '4Wed': AttendanceStatusEnum.optional(),
  '5Thu': AttendanceStatusEnum.optional(),
  '6Fri': AttendanceStatusEnum.optional(),
  '7Sat': AttendanceStatusEnum.optional(),
  // ... continue for all 28 days
  
  // Metrics (computed, but validate bounds)
  presentDays: z.number().min(0).max(28).optional(),
  absentDays: z.number().min(0).max(28).optional(),
  leaveDays: z.number().min(0).max(28).optional(),
  halfDays: z.number().min(0).max(28).optional(),
  weekOffDays: z.number().min(0).max(28).optional(),
  holidayDays: z.number().min(0).max(28).optional(),
});

export type EmployeeUpdate = z.infer<typeof EmployeeUpdateSchema>;
```

```typescript
// src/app/(actions)/employees.ts - UPDATED
import { EmployeeUpdateSchema } from '@/lib/validation/employee';

export async function updateEmployeeAction(
  id: string,
  updates: unknown // Accept unknown, validate below
) {
  try {
    // ✅ NEW: Validate input
    const validated = EmployeeUpdateSchema.parse(updates);

    // Now `validated` is type-safe and validated
    const dbUpdates: Record<string, unknown> = {};

    const numericFields = new Set([
      'sno', 'ctc', 'attendanceAllowance', 'dateOfJoining',
      'presentDays', 'absentDays', 'leaveDays', 'halfDays',
      'weekOffDays', 'holidayDays',
      // ... rest of numeric fields
    ]);

    for (const [key, value] of Object.entries(validated)) {
      if (value === undefined) continue;

      if (numericFields.has(key)) {
        dbUpdates[key] = Number(value);
      } else {
        dbUpdates[key] = value;
      }
    }

    const employee = await updateEmployee(id, dbUpdates);
    return { success: true, employee };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid data format',
        details: error.errors,
      };
    }
    return { success: false, error: 'Update failed' };
  }
}
```

---

## High Priority Fix: Rate Limiting

```bash
npm install @upstash/ratelimit redis
```

```typescript
// src/lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
});

// Different limits for different operations
export const apiLimits = {
  login: Ratelimit.slidingWindow(5, '15 m'), // 5 per 15 min
  upload: Ratelimit.slidingWindow(10, '1 h'), // 10 per hour
  default: Ratelimit.slidingWindow(100, '1 h'),
};
```

```typescript
// src/app/api/admin/users/route.ts - ADD RATE LIMIT
import { ratelimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  // ✅ NEW: Rate limiting
  const ip = request.ip || 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // ... rest of handler
}
```

---

## High Priority Fix: Structured Logging

```bash
npm install winston
```

```typescript
// src/lib/logger.ts
import winston from 'winston';

const isDev = process.env.NODE_ENV === 'development';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'hrms' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

if (isDev) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

```typescript
// Usage in code:
import { logger } from '@/lib/logger';

export async function updateEmployeeAction(id: string, updates: unknown) {
  const startTime = Date.now();
  try {
    logger.info('Updating employee', { employeeId: id });
    
    const employee = await updateEmployee(id, updates);
    
    logger.info('Employee updated successfully', {
      employeeId: id,
      duration: Date.now() - startTime,
    });

    return { success: true, employee };
  } catch (error) {
    logger.error('Failed to update employee', {
      employeeId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return { success: false, error: 'Update failed' };
  }
}
```

---

## Summary of Security Fixes

| Fix | Time | Risk |
|-----|------|------|
| JWT Auth | 2 hrs | HIGH |
| API Authentication | 1 hr | CRITICAL |
| Input Validation | 2 hrs | HIGH |
| Rate Limiting | 1 hr | HIGH |
| Structured Logging | 30 min | MEDIUM |

**Estimated Total Time: 6.5 hours**

Start with API Authentication (CRITICAL) and JWT Auth (HIGH).
