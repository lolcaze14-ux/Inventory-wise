import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://epclobycprlczcqblnwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2xvYnljcHJsY3pjcWJsbnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjU2NjMsImV4cCI6MjA4MzEwMTY2M30.4Iw4Z6dd-uPQfkAZtgIbtJZtkb4vn3yFQ7MMb7hURE4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);