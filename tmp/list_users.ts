import { supabase } from "./lib/supabase/client";

async function listUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("user_id, username, email, role_id");
    
    if (error) {
        console.error("Error listing users:", error);
    } else {
        console.log("All Users:", JSON.stringify(data, null, 2));
    }
}

listUsers();
