function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required env var: ${name}. Kopieer .env.local.example naar .env.local en vul deze waarde in.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceKey: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  anthropicKey: () => required('ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY),
  openaiKey: () => required('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
  storageBucket: () => process.env.SUPABASE_STORAGE_BUCKET || 'documents',
};
