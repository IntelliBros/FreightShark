export async function testConnection(): Promise<boolean> {
  console.log('📧 Email-only server mode - Database connection skipped');
  return true;
}
