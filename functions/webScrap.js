const { default: axios } = require("axios");
const cheerio = require("cheerio");
const https = require("https");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");

async function scrap_website(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({ headless: "new", timeout: 0 });
      const page = await browser.newPage();
      await page.goto(url);
      const content = await page.content();
      const $ = cheerio.load(content);
      await page.close()

      const data = [];

      $("p").each((i, el) => {
        const label = $(el).text();
        const route = url;
        const id = uuidv4();
        data.push({ id, label, route, title: label });
      });

      if (data.length > 0) {
        resolve(data);
      }
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = scrap_website;
