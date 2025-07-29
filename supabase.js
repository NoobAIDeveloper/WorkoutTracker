import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://qlrmpymzcedwgtpxazrg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscm1weW16Y2Vkd2d0cHhhenJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTE4OTgsImV4cCI6MjA2OTM2Nzg5OH0.JakI7myLl5Nt_BUmY4Tdqojp6mTc-hzA_PZIL3xwZv0'

export const supabase = createClient(supabaseUrl, supabaseKey)
