import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authOptions, isAuthConfigured } from "@/lib/auth";

const handler = NextAuth(authOptions);

async function authHandler(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "El acceso no está configurado. Contacta al administrador." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const response = await handler(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export { authHandler as GET, authHandler as POST };
