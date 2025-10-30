// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const { pathname } = request.nextUrl;

  // اجازه برای صفحه ورود و مسیرهای احراز هویت API
  if (pathname === "/" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // مسیرهای API را محافظت کن
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    try {
      const payload = await verifyJWT(token);

      // دسترسی ادمین برای مسیر /api/users
      if (pathname.startsWith("/api/users") && payload.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }
  }

  // مسیرهای اپلیکیشن (صفحات) را محافظت کن
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  try {
    const payload = await verifyJWT(token);

    // دسترسی ادمین برای صفحه /users
    if (pathname.startsWith("/users") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// پیکربندی مسیرهایی که قرار است درخواست‌ها را بگیرند
export const config = {
  matcher: [
    "/terms/:path*",
    "/phrases/:path*",
    "/categories/:path*",
    "/users/:path*",
    "/api/:path*",
  ],
};
