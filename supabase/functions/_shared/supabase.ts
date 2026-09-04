import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('https://spnfrtkybfdqahkrgyzc.supabase.co') ?? ''
const supabaseKey = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbmZydGt5YmZkcWFoa3JneXpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODUyNjM4MCwiZXhwIjoyMTA0MTAyMzgwfQ.krVXFsNy5VrnzMqAKVC3m5HeSMrm5QwOWE4THjvsIkY') ?? ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)