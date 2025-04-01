import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { users, UserRoleEnum } from '../shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingUsers = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (existingUsers.length === 0) {
      const hashedPassword = await hashPassword('admin');
      
      const [user] = await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: UserRoleEnum.enum.admin,
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date()
      }).returning();
      
      console.log('Admin user created successfully');
      console.log(user);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});