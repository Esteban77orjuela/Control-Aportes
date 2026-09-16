const requiredVars = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];

const missing = requiredVars.filter((name) => !process.env[name] || process.env[name].trim() === '');

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

console.log('Environment variables are configured correctly.');
