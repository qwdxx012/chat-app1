import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

// Клиент Supabase для аутентификации пользователей
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export default supabase;
