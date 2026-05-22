const cron = require("node-cron");
const admin = require("../config/firebase");
const Business = require("../models/Business");

cron.schedule("0 10 * * 1", async () => {
  try {
    const businesses = await Business.find({
      weeklyReports: true,
      fcmToken: { $ne: null },
    });

    for (const business of businesses) {
      await admin.messaging().send({
        token: business.fcmToken,

        notification: {
          title: "Weekly Report Ready",
          body: "Your weekly campaign report is ready",
        },
      });
    }

    console.log("Weekly reports sent");
  } catch (error) {
    console.error("WEEKLY REPORT ERROR:", error);
  }
});