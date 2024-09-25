const cron = require(`node-cron`)

cron.schedule(`* * * * *`, () => {
    console.log(`Cron job running every minute:', ${new Date().toLocaleString()}`)
})

