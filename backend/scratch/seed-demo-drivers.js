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

async function seedDrivers() {
  console.log("Starting demo driver seeding...");
  
  let createdCount = 0;
  let skippedCount = 0;
  
  // Status distribution
  const statusDistribution = [];
  for (let i = 0; i < 15; i++) statusDistribution.push("ACTIVE");
  for (let i = 0; i < 3; i++) statusDistribution.push("INACTIVE");
  for (let i = 0; i < 2; i++) statusDistribution.push("ON_LEAVE");

  for (let i = 0; i < DRIVER_NAMES.length; i++) {
    const fullName = DRIVER_NAMES[i];
    const parts = fullName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    
    // DEMO-DRV-001 ... DEMO-DRV-020
    const driverNumber = `DEMO-DRV-${String(i + 1).padStart(3, '0')}`;
    const licenceNumber = `SYN-LIC-${1000 + i}`;
    const status = statusDistribution[i] || "ACTIVE";
    
    const existing = await prisma.driver.findUnique({
      where: { driverNumber }
    });
    
    if (existing) {
      skippedCount++;
      console.log(`Skipped existing driver: ${driverNumber} (${fullName})`);
    } else {
      await prisma.driver.create({
        data: {
          driverNumber,
          firstName,
          lastName,
          licenceNumber,
          licenceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
          status,
        }
      });
      createdCount++;
      console.log(`Created demo driver: ${driverNumber} (${fullName}) [${status}]`);
    }
  }

  console.log("-----------------------------------------");
  console.log(`Demo driver seeding complete.`);
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log("-----------------------------------------");
}

seedDrivers()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
