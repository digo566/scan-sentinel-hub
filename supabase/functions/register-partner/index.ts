import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing env vars:", { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
      throw new Error("Server configuration error");
    }

    // Use service role client to verify the user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract JWT token from header
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the user using the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error("Invalid token");
    }
    
    if (!user) {
      console.error("No user found from token");
      throw new Error("Unauthorized");
    }

    console.log("User verified:", user.id);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError) {
      console.error("Role error:", roleError);
    }

    if (!roleData) {
      console.error("User is not admin");
      throw new Error("Only admins can register partners");
    }

    console.log("Admin verified, creating partner...");

    // Get partner data
    const { email, password, nome, whatsapp } = await req.json();

    if (!email || !password || !nome) {
      throw new Error("Email, password and nome are required");
    }

    // Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Create user error:", createError);
      throw new Error(createError.message);
    }

    console.log("User created:", newUser.user.id);

    // Update profile with name and whatsapp
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ nome, whatsapp })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Update role to admin
    const { error: roleUpdateError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", newUser.user.id);

    if (roleUpdateError) {
      console.error("Role update error:", roleUpdateError);
    }

    console.log("Partner registered successfully");

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error registering partner:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
