var cron = require('node-cron');
var engine = require('./engine');

cron.schedule('* * * * *', async () => {
  engine.executeAllOrders();
});
