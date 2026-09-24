require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const C = mongoose.connection.collection('profileverifications');

  const approved = await C.find({
    status: 'APPROVED',
    badgeType: { $in: ['BLUE', 'PURPLE'] }
  }).toArray();

  let migrated = 0;

  for (const row of approved) {
    await C.updateOne(
      { _id: row._id },
      { $addToSet: { badges: row.badgeType } }
    );
    migrated++;
  }

  console.log(`✅ Verification multi-badge migration: ${migrated} approved record(s) preserved`);

  const rows = await C.find(
    {},
    { projection: { _id:0, userId:1, status:1, badgeType:1, badges:1 } }
  ).toArray();

  console.log(JSON.stringify(rows, null, 2));

  await mongoose.disconnect();
}

main().catch(async e => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
