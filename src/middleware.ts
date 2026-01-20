import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('Middleware - Path:', req.nextUrl.pathname);
  console.log('Middleware - Session:', session ? 'EXISTS' : 'NONE');

  // Protect /invoices/local routes
  if (req.nextUrl.pathname.startsWith('/invoices/local')) {
    if (!session) {
      console.log('No session, redirecting to login');
      return NextResponse.redirect(new URL('/login', req.url));
    }
    console.log('Session found, allowing access');
  }

  // If logged in and on login page, redirect to dashboard
  if (req.nextUrl.pathname === '/login' && session) {
    console.log('Already logged in, redirecting to dashboard');
    return NextResponse.redirect(new URL('/invoices/local', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/invoices/local/:path*', '/login'],
};