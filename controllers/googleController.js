const { google } = require("googleapis");
const GoogleIntegration = require("../models/GoogleIntegration");
const googleAdsService = require("../services/googleAdsService");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ─── EXISTING OAuth (unchanged) ───────────────────────────────────────────

exports.getGoogleAuthUrl = async (req, res) => {
  try {
    const userId = req.user;
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/adwords"],
      state: userId.toString(),
    });
    res.json({ success: true, authUrl: url });
  } catch (error) {
    res.status(500).json({ success: false, message: "Google auth URL error", error: error.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Google code missing");

    const { tokens } = await oauth2Client.getToken(code);

    await GoogleIntegration.findOneAndUpdate(
      { user: state },
      {
        user: state,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiryDate: tokens.expiry_date,
        isConnected: true,
      },
      { upsert: true, new: true }
    );

    res.send("Google Ads connected successfully. You can close this tab.");
  } catch (error) {
    res.status(500).send("Google callback error: " + error.message);
  }
};

exports.getGoogleStatus = async (req, res) => {
  try {
    const integration = await GoogleIntegration.findOne({ user: req.user });

    if (!integration || !integration.refreshToken) {
      return res.json({
        success: true,
        isConnected: false,
        message: "Google Ads not connected",
      });
    }

    res.json({
      success: true,
      isConnected: true,
      message: "Google OAuth connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      isConnected: false,
      message: "Google status check failed",
      error: error.message,
    });
  }
};

exports.verifyGoogleAdsAccess = async (req, res) => {
  try {
    const { GoogleAdsApi } = require("google-ads-api");
    const integration = await GoogleIntegration.findOne({ user: req.user });

    if (!integration || !integration.refreshToken) {
      return res.status(400).json({ success: false, message: "Google Ads not connected" });
    }

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      refresh_token: integration.refreshToken,
      login_customer_id: process.env.GOOGLE_MANAGER_CUSTOMER_ID,
    });

    const campaigns = await customer.query(`
      SELECT campaign.id, campaign.name, campaign.status
      FROM campaign LIMIT 10
    `);

    res.json({ success: true, message: "Google Ads API working", customerId: process.env.GOOGLE_ADS_CUSTOMER_ID, campaigns });
  } catch (error) {
    console.log("GOOGLE ADS VERIFY ERROR:", error);
    res.status(500).json({ success: false, message: "Google Ads API verify failed", error: error.message });
  }
};

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────

exports.getCampaigns = async (req, res) => {
  try {
    const data = await googleAdsService.getCampaigns(req.user);
    res.json({ success: true, data });
  } catch (error) {
    console.log("GET GOOGLE CAMPAIGNS FULL ERROR:", error);
    console.log("MESSAGE:", error.message);
    console.log("ERRORS:", error.errors);

    res.status(500).json({
    success: false,
    message:
    error?.message ||
    error?.errors?.[0]?.message ||
    "Google Ads campaigns fetch failed",
});
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const data = await googleAdsService.createCampaign(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    console.error("createCampaign error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const data = await googleAdsService.updateCampaign(req.user, req.params.campaignId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { budget } = req.body;
    const data = await googleAdsService.updateBudget(req.user, campaignId, budget);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAccountOverview = async (req, res) => {
  try {
    const data = await googleAdsService.getAccountOverview(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── AD GROUPS ────────────────────────────────────────────────────────────

exports.getAdGroups = async (req, res) => {
  try {
    const data = await googleAdsService.getAdGroups(req.user, req.params.campaignId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdGroup = async (req, res) => {
  try {
    const data = await googleAdsService.createAdGroup(req.user, { ...req.body, campaignId: req.params.campaignId });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADS ──────────────────────────────────────────────────────────────────

exports.createSearchAd = async (req, res) => {
  try {
    const data = await googleAdsService.createSearchAd(req.user, { ...req.body, adGroupId: req.params.adGroupId });
    res.json({ success: true, data });
  } catch (error) {
    console.error("createSearchAd error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDisplayAd = async (req, res) => {
  try {
    const data = await googleAdsService.createDisplayAd(req.user, { ...req.body, adGroupId: req.params.adGroupId });
    res.json({ success: true, data });
  } catch (error) {
    console.error("createDisplayAd error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createShoppingCampaign = async (req, res) => {
  try {
    const data = await googleAdsService.createShoppingCampaign(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    console.error("createShoppingCampaign error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── KEYWORDS ─────────────────────────────────────────────────────────────

exports.getKeywords = async (req, res) => {
  try {
    const data = await googleAdsService.getKeywords(req.user, req.params.adGroupId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addKeywords = async (req, res) => {
  try {
    const data = await googleAdsService.addKeywords(req.user, req.params.adGroupId, req.body.keywords);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKeywordSuggestions = async (req, res) => {
  try {
    const data = await googleAdsService.getKeywordSuggestions(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────

exports.getCampaignAnalytics = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await googleAdsService.getCampaignAnalytics(req.user, campaignId, { startDate, endDate });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CONVERSION TRACKING ──────────────────────────────────────────────────

exports.createConversionAction = async (req, res) => {
  try {
    const data = await googleAdsService.createConversionAction(req.user, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConversionActions = async (req, res) => {
  try {
    const data = await googleAdsService.getConversionActions(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//logout and disconnect
exports.disconnectGoogle = async (req, res) => {
  try {
    await GoogleIntegration.findOneAndDelete({ user: req.user });

    res.json({
      success: true,
      message: "Google Ads disconnected successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Google disconnect failed",
      error: error.message,
    });
  }
};