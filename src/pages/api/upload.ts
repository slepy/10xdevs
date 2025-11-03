import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/upload
 * Upload image to Supabase Storage
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const userRole = session.user.user_metadata?.role;

    // eslint-disable-next-line no-console
    console.log("User info:", {
      userId: session.user.id,
      email: session.user.email,
      role: userRole,
      metadata: session.user.user_metadata,
    });

    if (userRole !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden", message: "Brak uprawnień" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "Bad Request", message: "Brak pliku" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Nieprawidłowy typ pliku. Dozwolone: jpg, jpeg, png, webp" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Plik jest za duży. Maksymalny rozmiar to 5MB" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // eslint-disable-next-line no-console
    console.log("Uploading file:", {
      fileName,
      fileType: file.type,
      fileSize: file.size,
      bufferSize: buffer.length,
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("offer_images").upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase upload error:", error);

      // Provide more specific error messages
      let errorMessage = "Błąd podczas uploadu obrazu";
      if (error.message.includes("Bucket not found")) {
        errorMessage = "Bucket 'offer_images' nie istnieje. Skonfiguruj Supabase Storage.";
      } else if (error.message.includes("not allowed")) {
        errorMessage = "Brak uprawnień do uploadu. Sprawdź polityki RLS.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return new Response(JSON.stringify({ error: "Internal Server Error", message: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("offer_images").getPublicUrl(data.path);

    return new Response(
      JSON.stringify({
        url: publicUrl,
        path: data.path,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: "Wystąpił błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/upload
 * Delete image from Supabase Storage
 */
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const userRole = session.user.user_metadata?.role;
    if (userRole !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden", message: "Brak uprawnień" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: "Bad Request", message: "Brak URL obrazu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract file path from URL
    // URL format: https://[project-id].supabase.co/storage/v1/object/public/offer_images/[file-path]
    const urlParts = url.split("/offer_images/");
    if (urlParts.length < 2) {
      return new Response(JSON.stringify({ error: "Bad Request", message: "Nieprawidłowy URL obrazu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filePath = urlParts[1];

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from("offer_images").remove([filePath]);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase delete error:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error", message: "Błąd podczas usuwania obrazu" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Obraz został usunięty",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: "Wystąpił błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
