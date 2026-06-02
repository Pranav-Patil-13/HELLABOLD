import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvzcyjzylpdssezvlgvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2emN5anp5bHBkc3NlenZsZ3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTQwMDcsImV4cCI6MjA5NTczMDAwN30.Imc0vDCP7ThSIgtQgm6DNdoHjRAD6mHB4ewMawkFnOM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', 'HB-48039');
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkOrder();
