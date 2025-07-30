import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './config.js'

const supabaseUrl = SUPABASE_URL
const supabaseKey = SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
