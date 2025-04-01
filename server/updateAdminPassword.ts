import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function updateAdminPassword() {
  try {
    const hashedPassword = await hashPassword('admin');
    
    const result = await db.update(users)
      .set({ 
        password: hashedPassword 
      })
      .where(eq(users.username, 'admin'))
      .returning();
    
    console.log('Admin password updated successfully');
    console.log(result);
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
}

updateAdminPassword().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});