require("dotenv").config();
const express = require("express");
const app = express();
const MiniSearch = require("minisearch");
const supabase = require("./config/db");
const cors = require(`cors`);
const { EmailService } = require("./services/sendMail");
const scrap_website = require("./functions/webScrap");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res, next) => {
  res.send(`Express `);
});

app.get(`/search`, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (q) {
      const { data, error } = await supabase
        .from(`website_data`)
        .select(`scrap_data`);

      if (data && data.length) {
        let miniSearch = new MiniSearch({
          fields: ["title", "href", "route"],
          storeFields: ["title", "href", "route"],
        });

        miniSearch.addAll(data[0].scrap_data);

        let results = miniSearch.search(q, { fuzzy: 0.2 });
        if (results && results.length > 0) {
          res.send(results);
        } else {
          res.json({ success: false, message: `Result not found.` });
        }
      } else {
        res.json({
          success: false,
          message: `Data not found`,
        });
      }
    } else {
      res.json({
        success: false,
        message: `SearchText is required.`,
      });
    }
  } catch (error) {
    res.send(error?.message || error || `Internal server`);
  }
});

app.post(`/subscribe`, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.json(`Email is required`);
    }

    const { data, error } = await supabase
      .from(`users`)
      .select(`*`)
      .eq(`email`, email)
      .maybeSingle();

    console.log(data);

    const mailInfo = await EmailService.sendEmail(
      email,
      `Subscribe : Thank you :)`,
      `<p>Thank You</p><br/><a href="https://gandivam.co.in/website?unsubscribe=${email}" target="_blank">Unsubscribe</a>`
    );

    if (data) {
      res.status(500).json({
        success: false,
        message: `${email} has been already subscribed`,
      });
    } else {
      const { data, error } = await supabase
        .from(`users`)
        .insert({ email: email, isSubscribe: true })
        .select(`userId, email`);

      if (error) throw error;

      if (data) {
        res.status(200).json({
          success: true,
          data,
          message: `Subscribe has been successfully.`,
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Subscribe failed`,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || error || `Internal server error`,
    });
  }
});

app.post(`/unsubscribe`, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.json(`Email is required`);
    }

    const { data, error } = await supabase
      .from(`users`)
      .delete()
      .eq(`email`, email);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: `${email} has been unsubscribed.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || error || `Internal server error`,
    });
  }
});

app.post(`/sendMail`, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(404).json({
        success: false,
        message: `Email is required`,
      });
    }

    const mailInfo = await EmailService.sendEmail(
      email,
      `Subscribe : Thank you :)`,
      `<p>Thank You</p>`
    );

    console.log(mailInfo);

    if (mailInfo) {
      res.status(200).json({
        success: true,
        message: `Subscribe mail sent successfully.`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Mail sent : Failed`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || error || `Internal server error`,
    });
  }
});

app.post(`/users`, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(`users`).select(`*`);

    if (error) throw error;

    if (data) {
      res.status(200).json({
        success: false,
        data,
        message: `${data.length} : User`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `${0} : User found`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || error || `Internal server error`,
    });
  }
});

app.post(`/update-search`, async (req, res, next) => {
  try {
    const { urls } = req.body;

    let result = [];

    var i = 1;
    for (const item of urls) {
      console.log(`Total : ${urls.length}, Done : ${i + 1}`);
      const response = await scrap_website(item);
      result.push(response);
    }

    if (result.length > 0) {
      const { data, error } = await supabase
        .from(`website_data`)
        .update({ scrap_data: result.flat(Infinity) });
      res.json({ message: `update`, data: result.flat(Infinity) });
    } else {
      res.json({ message: `failed` });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(8080, () => {
  console.log(`Started at 8080`);
});
