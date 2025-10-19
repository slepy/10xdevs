import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // This is a one-time admin endpoint to update user metadata
  // In production, this should be protected with proper admin authentication

  try {
    const { userId, metadata } = await request.json();

    if (!userId || !metadata) {
      return new Response(JSON.stringify({ error: "Missing userId or metadata" }), { status: 400 });
    }

    // Use the admin API to update user metadata
    const { data, error } = await locals.supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: error.code }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      }),
      { status: 200 }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
