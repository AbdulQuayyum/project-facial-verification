import cron from 'node-cron';
import axios from 'axios';

import UptimeSchema from '../models/uptime.js';

cron.schedule('*/5 * * * *', async () => {
    try {
        const response = await axios.get("https://project-facial-verification.vercel.app/");
        const status = response.status === 200 ? 'up' : 'down';
        await UptimeSchema.create({ timestamp: new Date(), status });
    } catch (error) {
        await UptimeSchema.create({ timestamp: new Date(), status: 'down' });
    }
});