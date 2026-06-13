import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://wrrertkbvyjffezkosuc.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_5-iJgzv8wim_t7Kdc_1Avg_tP1OwH7s'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
