require("dotenv").config();
const express = require("express");
const app = express();
const MiniSearch = require("minisearch");
const supabase = require("./config/db");
const cors = require(`cors`);
const { EmailService } = require("./services/sendMail");

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

      if (data) {
        let miniSearch = new MiniSearch({
          fields: ["title", "href"],
          storeFields: ["title", "href"],
        });

        miniSearch.addAll(data[0].scrap_data);

        let results = miniSearch.search(q, { fuzzy: 0.2 });
        if (results && results.length > 0) {
          res.send(results);
        } else {
          res.json({ success: false, message: `Result not found.` });
        }
      }
    } else {
      res.json(`SearchText is required.`);
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

app.listen(8080, () => {
  console.log(`Started at 8080`);
});
