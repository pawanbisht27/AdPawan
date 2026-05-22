const MetaIntegration = require("../models/MetaIntegration");
const Business = require("../models/Business");

const META_API_VERSION = process.env.META_API_VERSION || "v20.0";

exports.getMetaAuthUrl = async (req, res) => {
  try {
    if (!process.env.META_APP_ID || !process.env.META_REDIRECT_URI) {
      return res.status(500).json({
        message: "Meta app config missing in .env",
      });
    }

  const scopes = [
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "ads_read",
  "ads_management",
  "business_management"
].join(",");

    const state = req.user.toString();

    const url =
      `https://www.facebook.com/${META_API_VERSION}/dialog/oauth` +
      `?client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.META_REDIRECT_URI)}` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(scopes)}`;
      console.log("META AUTH URL:", url);
      console.log("META REDIRECT URI:", process.env.META_REDIRECT_URI);

    return res.json({ url });
  } catch (error) {
    console.error("META AUTH URL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.metaCallback = async (req, res) => {
   console.log("META CALLBACK HIT ");
   console.log("QUERY:", req.query);
  try {

    
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
      return res.status(500).send("Meta app credentials missing");
    }

    const tokenUrl =
      `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.META_REDIRECT_URI)}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.log("META TOKEN ERROR:", tokenData);
      return res.status(400).send("Meta token exchange failed");
    }

    const accessToken = tokenData.access_token;

    const meResponse = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/me?fields=id,name,email&access_token=${accessToken}`
    );
     const meData = await meResponse.json();
console.log("ME DATA:", meData);

const pagesResponse = await fetch(
  `https://graph.facebook.com/${META_API_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${accessToken}`
);
const pagesData = await pagesResponse.json();
console.log("PAGES DATA:", pagesData);

const adAccountsResponse = await fetch(
  `https://graph.facebook.com/${META_API_VERSION}/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`
);
const adAccountsData = await adAccountsResponse.json();
console.log("AD ACCOUNTS DATA:", adAccountsData);

    const business = await Business.findOne({ user: state });

    await MetaIntegration.findOneAndUpdate(
      { user: state },
      {
        user: state,
        business: business?._id || null,
        accessToken,
        tokenType: tokenData.token_type || "",
        expiresIn: tokenData.expires_in || 0,
        metaUserId: meData.id || "",
        metaName: meData.name || "",
        pages: pagesData.data || [],
        adAccounts: adAccountsData.data || [],
        isConnected: true,
      },
      { upsert: true, new: true }
    );

    return res.send(`
      <html>
        <body style="font-family: Arial; text-align:center; padding-top:60px;">
          <h2>Meta Connected Successfully ✅</h2>
          <p>You can close this tab and return to AdPawan.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("META CALLBACK ERROR:", error);
    return res.status(500).send(error.message);
  }
};

exports.getMetaStatus = async (req, res) => {
  try {
    const integration = await MetaIntegration.findOne({ user: req.user });

    if (!integration) {
      return res.json({
        connected: false,
        integration: null,
      });
    }

    return res.json({
      connected: integration.isConnected,
      integration,
    });
  } catch (error) {
    console.error("META STATUS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.saveSelectedAssets = async (req, res) => {
  try {
    const {
      selectedPageId,
      selectedPageName,
      selectedInstagramId,
      selectedAdAccountId,
    } = req.body;

    const integration = await MetaIntegration.findOneAndUpdate(
      { user: req.user },
      {
        selectedPageId: selectedPageId || "",
        selectedPageName: selectedPageName || "",
        selectedInstagramId: selectedInstagramId || "",
        selectedAdAccountId: selectedAdAccountId || "",
      },
      { new: true }
    );

    if (!integration) {
      return res.status(404).json({ message: "Meta integration not found" });
    }

    return res.json({
      message: "Meta assets saved successfully",
      integration,
    });
  } catch (error) {
    console.error("SAVE META ASSETS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.disconnectMeta = async (req, res) => {
  try {
    const integration = await MetaIntegration.findOneAndUpdate(
      { user: req.user },
      {
        accessToken: "",
        pages: [],
        adAccounts: [],
        selectedPageId: "",
        selectedPageName: "",
        selectedInstagramId: "",
        selectedAdAccountId: "",
        isConnected: false,
      },
      { new: true }
    );

    return res.json({
      message: "Meta disconnected successfully",
      integration,
    });
  } catch (error) {
    console.error("DISCONNECT META ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};