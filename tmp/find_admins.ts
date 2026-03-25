import { supabase } from "./lib/supabase/client";

async function findAdmins() {
    const { data, error } = await supabase
        .from("users")
        .select("user_id, email, role_id")
        .eq("role_id", 1);
    
    if (error) {
        console.error("Error finding admins:", error);
    } else {
        console.log("Admins:", JSON.stringify(data, null, 2));
    }
}

findAdmins();
