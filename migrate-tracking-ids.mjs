import { getDb, generateTrackingId } from './server/db.ts';
import { orders } from './drizzle/schema.ts';
import { eq, isNull } from 'drizzle-orm';

async function migrateTrackingIds() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    // Get all orders without trackingId
    const ordersWithoutTracking = await db
      .select()
      .from(orders)
      .where(isNull(orders.trackingId));
    
    console.log(`Found ${ordersWithoutTracking.length} orders without Tracking ID`);
    
    if (ordersWithoutTracking.length === 0) {
      console.log('✅ All orders already have Tracking IDs');
      process.exit(0);
    }
    
    // Generate and update Tracking IDs
    let updated = 0;
    for (const order of ordersWithoutTracking) {
      // Generate Tracking ID based on createdAt timestamp
      const date = new Date(order.createdAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const orderSuffix = order.orderID.replace(/[-\s]/g, '').toUpperCase().slice(-4).padStart(4, '0');
      const trackingId = `PP4${day}${month}${year}${hour}${minute}${orderSuffix}`;
      
      await db
        .update(orders)
        .set({ trackingId })
        .where(eq(orders.id, order.id));
      
      console.log(`✓ Order ${order.orderID}: ${trackingId}`);
      updated++;
    }
    
    console.log(`\n✅ Migration complete! Updated ${updated} orders with Tracking IDs`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTrackingIds();
