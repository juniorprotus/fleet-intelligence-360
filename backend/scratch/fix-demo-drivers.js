require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DRIVER_NAMES = [
  "Brian Otieno", "Kevin Mwangi", "Joseph Kamau", "Daniel Ochieng",
  "Collins Kiptoo", "Peter Njoroge", "Samuel Okoth", "Dennis Mutua",
  "James Onyango", "Allan Wekesa", "Victor Omondi", "Eric Kariuki",
  "George Maina", "Mark Odhiambo", "David Kiprotich", "Francis Mwangi",
  "Patrick Ouma", "Martin Kiplagat", "Antony Wanjala", "Stephen Njuguna"
];

async function fixDrivers() {
  console.log("Starting demo driver fix (inserting to User table)...");
  
  let createdCount = 0;
  let skippedCount = 0;
  
  // Status distribution
  const statusDistribution = [];
  for (let i = 0; i < 15; i++) statusDistribution.push(true); // ACTIVE
  for (let i = 0; i < 3; i++) statusDistribution.push(false); // INACTIVE
  for (let i = 0; i < 2; i++) statusDistribution.push(true); // ON_LEAVE (treated as active for now or inactive)

  for (let i = 0; i < DRIVER_NAMES.length; i++) {
    const fullName = DRIVER_NAMES[i];
    const parts = fullName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    
    const email = `demo.drv.${String(i + 1).padStart(3, '0')}@fi360.com`;
    const isActive = statusDistribution[i];
    
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existing) {
      skippedCount++;
      console.log(`Skipped existing user driver: ${email} (${fullName})`);
    } else {
      await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: 'DRIVER',
          password: '$2b$10$2YfTS.2CVqr1gixZ4J/x/uj5PYsgKEtJFRqoanzzGar3lo0RSjk3m', // Same as Senior Driver
          isActive,
          department: 'Logistics',
          depot: 'Nairobi Main Depot',
        }
      });
      createdCount++;
      console.log(`Created user driver: ${email} (${fullName}) [Active: ${isActive}]`);
    }
  }

  console.log("-----------------------------------------");
  console.log(`Demo driver fix complete.`);
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log("-----------------------------------------");
}

fixDrivers()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
