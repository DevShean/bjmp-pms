import { supabase } from "./lib/supabase/client";

async function findAdmin() {
    const { data, error } = await supabase
        .from("users")
        .select("user_id, email")
        .eq("email", "admin@bjmp.portal")
        .single();
    
    if (error) {
        console.error("Error finding admin:", error);
    } else {
        console.log("Admin User:", data);
    }
}

findAdmin();
