import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, "vikas.kukreja@meradhan.co"));
    
    if (existingAdmin.length === 0) {
      // Create default admin user
      const [adminUser] = await db.insert(users).values({
        email: "vikas.kukreja@meradhan.co",
        name: "Vikas Kukreja",
        role: "admin",
        isActive: true,
      }).returning();
      
      console.log("✅ Default admin user created:", adminUser.email);
    } else {
      console.log("ℹ️ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}