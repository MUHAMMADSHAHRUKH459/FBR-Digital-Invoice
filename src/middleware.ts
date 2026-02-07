import { createServerClient } from '@supabase/ssr';
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
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  console.log('🔐 Middleware Check:', {
    path,
    hasSession: !!session,
    userEmail: session?.user?.email
  });

  // 🔒 PROTECTED ROUTES - Only Local Invoices (Login Required)
  const protectedRoutes = [
    '/invoices/local',
    '/invoices/local/karachi',
    '/invoices/local/lahore',
    '/invoices/local/cashbook'
  ];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(protectedPath => 
    path === protectedPath || path.startsWith(protectedPath + '/')
  );

  // 🔒 Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    console.log('❌ No session - redirecting to login');
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path); // Save where they wanted to go
    return NextResponse.redirect(loginUrl);
  }

  // 🔓 Redirect to local invoices if already logged in and trying to access login page
  if (path === '/login' && session) {
    console.log('✅ Already logged in - redirecting to local invoices');
    return NextResponse.redirect(new URL('/invoices/local', req.url));
  }

  console.log('✅ Access granted');
  return response;
}

// Only run middleware on these paths
export const config = {
  matcher: [
    '/invoices/local/:path*',  // Protected
    '/login'                    // Auth page
  ],
};