// controllers/metaAdsController.js
// YE NAYA FILE HAI — controllers/ folder mein daalo

const MetaIntegration = require("../models/MetaIntegration");

const META_API_VERSION = process.env.META_API_VERSION || "v20.0";
const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

// ─────────────────────────────────────────────────
// Helper: DB se token + account IDs lo
// ─────────────────────────────────────────────────
async function getMetaCredentials(userId) {
  const integration = await MetaIntegration.findOne({ user: userId });

  if (!integration || !integration.isConnected) {
    throw new Error(
      "Meta connected nahi hai. Pehle /api/meta/auth-url se connect karo."
    );
  }

  if (!integration.selectedAdAccountId) {
    throw new Error(
      "Ad Account select nahi kiya. /api/meta/save-assets call karo pehle."
    );
  }

  return {
    accessToken:    integration.accessToken,
    adAccountId:    integration.selectedAdAccountId, // "act_XXXXXXXXX"
    pageId:         integration.selectedPageId,
    instagramId:    integration.selectedInstagramId,
  };
}

// ─────────────────────────────────────────────────
// GET /api/meta-ads/campaigns
// Connected account ke saare campaigns
// ─────────────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
  try {
    const { accessToken, adAccountId } = await getMetaCredentials(req.user);

    const response = await fetch(
      `${GRAPH}/${adAccountId}/campaigns` +
      `?fields=id,name,status,objective,daily_budget,start_time,stop_time` +
      `&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.error.message });
    }

    return res.json({ campaigns: data.data || [] });
  } catch (error) {
    console.error("GET CAMPAIGNS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────
// POST /api/meta-ads/campaigns
// Naya campaign banao
//
// Body:
// {
//   name: "Mera Campaign",
//   objective: "OUTCOME_LEADS",
//   daily_budget: 1000          <- cents mein (1000 = $10 ya ₹10)
// }
//
// Objectives:
//   OUTCOME_LEADS      - Lead generation
//   OUTCOME_SALES      - Sales/Conversions
//   OUTCOME_TRAFFIC    - Website Traffic
//   OUTCOME_AWARENESS  - Brand Awareness
//   OUTCOME_ENGAGEMENT - Post Engagement
// ─────────────────────────────────────────────────
exports.createCampaign = async (req, res) => {
  try {
    const { accessToken, adAccountId } = await getMetaCredentials(req.user);
    const { name, objective, daily_budget, start_time } = req.body;

    if (!name || !objective || !daily_budget) {
      return res.status(400).json({
        message: "name, objective, aur daily_budget required hain",
      });
    }

    const body = new URLSearchParams({
      name,
      objective,
      status:                "PAUSED",
      daily_budget:          String(daily_budget),
      special_ad_categories: "[]",
      access_token:          accessToken,
    });

    if (start_time) body.append("start_time", start_time);

    const response = await fetch(`${GRAPH}/${adAccountId}/campaigns`, {
      method: "POST",
      body,
    });
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        message: data.error.message,
        details: data.error,
      });
    }

    return res.json({
      message:     "Campaign ban gaya ✅ (PAUSED hai — review ke baad ACTIVE karo)",
      campaign_id: data.id,
    });
  } catch (error) {
    console.error("CREATE CAMPAIGN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────
// POST /api/meta-ads/create-full-ad
// Ek call mein poora ad banao:
//   AdSet + Creative + Ad
//
// Body:
// {
//   campaign_id:  "12345678",
//   adset_name:   "India 18-35",       <- optional, default: ad_name + " AdSet"
//   daily_budget: 500,                 <- cents mein
//   countries:    ["IN"],              <- optional, default: ["IN"]
//   age_min:      18,                  <- optional, default: 18
//   age_max:      35,                  <- optional, default: 65
//   placements:   ["facebook_feed", "instagram_feed", "instagram_stories", "instagram_reels"],
//
//   ad_name:      "Mera Ad",
//   headline:     "Abhi Join Karo!",
//   description:  "Best offer aaj tak",
//   image_url:    "https://yoursite.com/banner.jpg",  <- public URL hona chahiye
//   website_url:  "https://yoursite.com",
//   cta:          "LEARN_MORE"
//          Options: LEARN_MORE | SIGN_UP | SHOP_NOW | CONTACT_US | GET_QUOTE
// }
// ─────────────────────────────────────────────────
exports.createFullAd = async (req, res) => {
  try {
    const { accessToken, adAccountId, pageId, instagramId } =
      await getMetaCredentials(req.user);

    const {
      campaign_id,
      adset_name,
      daily_budget = 500,
      countries = ["IN"],
      age_min = 18,
      age_max = 65,
      placements = ["facebook_feed", "instagram_feed"],
      ad_name,
      headline,
      description = "",
      website_url,
      cta = "LEARN_MORE",
    } = req.body;

    // Validation
    if (!campaign_id || !ad_name || !headline || !website_url) {
      return res.status(400).json({
        message:
          "campaign_id, ad_name, headline, website_url required hain",
      });
    }

    // ── Step 1: AdSet banao ────────────────────
    console.log("Step 1: AdSet ban raha hai...");

const targeting = buildTargeting(
  countries,
  age_min,
  age_max,
  placements
);

const campaignObjective = await getCampaignObjective(campaign_id, accessToken);
const config = getAdSetConfig(campaignObjective);

console.log("Campaign Objective:", campaignObjective);
console.log("AdSet Config:", config);

const adSetBody = new URLSearchParams({
  name:              adset_name || `${ad_name} - AdSet`,
  campaign_id,
  billing_event:     config.billing_event,
  optimization_goal: config.optimization_goal,
  bid_strategy:      config.bid_strategy,     
  status:            "PAUSED",
  targeting:         JSON.stringify(targeting),
  access_token:      accessToken,
});

if (config.destination_type) {
  adSetBody.append("destination_type", config.destination_type);
}

if (config.bid_amount) {
  adSetBody.append("bid_amount", config.bid_amount); 
}

const adSetResponse = await fetch(`${GRAPH}/${adAccountId}/adsets`, {
  method: "POST",
  body: adSetBody,
});

const adSetData = await adSetResponse.json();

if (adSetData.error) {

  console.log(
    "ADSET ERROR FULL:",
    JSON.stringify(adSetData, null, 2)
  );

  return res.status(400).json({
    message: "AdSet fail: " + adSetData.error.message,
    details: adSetData.error,
  });
}

const adset_id = adSetData.id;

console.log("✅ AdSet ID:", adset_id);

    // ── Step 2: Creative banao ─────────────────
    console.log("Step 2: Creative ban raha hai...");

    const objectStorySpec = {
      page_id: pageId,
      link_data: {
        link: website_url,
        message: description,
        name: headline,
        call_to_action: {
          type: cta,
          value: {
            link: website_url,
          },
        },
      },
    };

    // Instagram linked hai toh use karo
    if (instagramId) {
      objectStorySpec.instagram_actor_id = instagramId;
    }

    const creativeResponse = await fetch(
      `${GRAPH}/${adAccountId}/adcreatives`,
      {
        method: "POST",
        body: new URLSearchParams({
          name: `${ad_name} - Creative`,
          object_story_spec: JSON.stringify(objectStorySpec),
          access_token: accessToken,
        }),
      }
    );

    const creativeData = await creativeResponse.json();

    if (creativeData.error) {
      return res.status(400).json({
        message: "Creative fail: " + creativeData.error.message,
        details: creativeData.error,
      });
    }

    const creative_id = creativeData.id;
    console.log("✅ Creative ID:", creative_id);

    // ── Step 3: Ad banao ───────────────────────
    console.log("Step 3: Ad ban raha hai...");

    const adResponse = await fetch(`${GRAPH}/${adAccountId}/ads`, {
      method: "POST",
      body: new URLSearchParams({
        name: ad_name,
        adset_id,
        creative: JSON.stringify({ creative_id }),
        status: "PAUSED",
        access_token: accessToken,
      }),
    });

    const adData = await adResponse.json();

    if (adData.error) {
      console.log(
  "AD ERROR FULL:",
  JSON.stringify(adData, null, 2)
);
      return res.status(400).json({
        message: "Ad fail: " + adData.error.message,
        details: adData.error,
      });
    }

    console.log("✅ Ad ban gaya! ID:", adData.id);

    return res.json({
      message:
        "Ad ban gaya ✅ PAUSED hai — Ads Manager se ACTIVE karo",
      result: {
        campaign_id,
        adset_id,
        creative_id,
        ad_id: adData.id,
        ads_manager_url:
          "https://business.facebook.com/adsmanager/manage/ads",
      },
    });
  } catch (error) {
    console.error("CREATE FULL AD ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────
// GET /api/meta-ads/insights
// Campaign performance data
//
// Query params:
//   date_preset: today | yesterday | last_7d | last_14d | last_30d | this_month
//   level:       account | campaign | adset | ad
// ─────────────────────────────────────────────────
exports.getInsights = async (req, res) => {
  try {
    const { accessToken, adAccountId } = await getMetaCredentials(req.user);

    const { date_preset = "last_30d", level = "campaign" } = req.query;

    const fields = [
      "campaign_name",
      "adset_name",
      "ad_name",
      "impressions",
      "reach",
      "clicks",
      "ctr",
      "cpc",
      "cpm",
      "spend",
      "actions",
      "cost_per_action_type",
    ].join(",");

    const response = await fetch(
      `${GRAPH}/${adAccountId}/insights` +
      `?fields=${fields}` +
      `&date_preset=${date_preset}` +
      `&level=${level}` +
      `&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.error.message });
    }

    return res.json({
      insights:    data.data || [],
      date_preset,
      level,
    });
  } catch (error) {
    console.error("GET INSIGHTS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────
// POST /api/meta-ads/ad-status
// Ad ko ACTIVE ya PAUSED karo
//
// Body: { ad_id: "AD_ID", status: "ACTIVE" }
// ─────────────────────────────────────────────────
exports.updateAdStatus = async (req, res) => {
  try {

    const { accessToken } =
      await getMetaCredentials(req.user);

    const {
      campaign_id,
      status,
    } = req.body;

    if (!campaign_id || !status) {
      return res.status(400).json({
        message: "campaign_id aur status required hain",
      });
    }

    const response = await fetch(
      `${GRAPH}/${campaign_id}`,
      {
        method: "POST",
        body: new URLSearchParams({
          status,
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        message: data.error.message,
        details: data.error,
      });
    }

    return res.json({
      message: `Campaign ${status} ho gaya ✅`,
    });

  } catch (error) {
    console.error("UPDATE META STATUS ERROR:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

async function getCampaignObjective(campaignId, accessToken) {
  const response = await fetch(
    `${GRAPH}/${campaignId}?fields=objective&access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.objective || "OUTCOME_TRAFFIC";
}

function getAdSetConfig(objective) {
  const config = {
    OUTCOME_TRAFFIC: {
      optimization_goal: "LINK_CLICKS",
      billing_event:     "IMPRESSIONS",
      destination_type:  "WEBSITE",
      bid_strategy:      "LOWEST_COST_WITHOUT_CAP",
    },
    OUTCOME_LEADS: {
      optimization_goal: "LEAD_GENERATION",
      billing_event:     "IMPRESSIONS",
      destination_type:  "ON_AD",
    },
    OUTCOME_ENGAGEMENT: {
      optimization_goal: "POST_ENGAGEMENT",
      billing_event:     "IMPRESSIONS",
      destination_type:  "ON_AD",
    },
    OUTCOME_AWARENESS: {
      optimization_goal: "REACH",
      billing_event:     "IMPRESSIONS",
      bid_strategy:      "LOWEST_COST_WITH_BID_CAP",  
      bid_amount:         200, 

    },
    OUTCOME_SALES: {
      optimization_goal: "LINK_CLICKS", 
      billing_event:     "IMPRESSIONS",
      destination_type:  "WEBSITE",
      bid_strategy:      "LOWEST_COST_WITHOUT_CAP",
    },
  };

  return config[objective] || config.OUTCOME_TRAFFIC;
}

// ─────────────────────────────────────────────────
// Helper: Placement + Targeting object banao
// ─────────────────────────────────────────────────
function buildTargeting(countries, age_min, age_max, placements) {
  const targeting = {
    geo_locations: { countries },
    age_min,
    age_max,
  };

  const publisherPlatforms  = new Set();
  const facebookPositions   = [];
  const instagramPositions  = [];

  placements.forEach((p) => {
    switch (p) {
      case "facebook_feed":
        publisherPlatforms.add("facebook");
        facebookPositions.push("feed");
        break;
      case "instagram_feed":
        publisherPlatforms.add("instagram");
        instagramPositions.push("stream");
        break;
      case "instagram_stories":
        publisherPlatforms.add("instagram");
        instagramPositions.push("story");
        break;
      case "instagram_reels":
        publisherPlatforms.add("instagram");
        instagramPositions.push("reels");
        break;
    }
  });

  if (publisherPlatforms.size > 0) {
    targeting.publisher_platforms = [...publisherPlatforms];
  }
  if (facebookPositions.length > 0) {
    targeting.facebook_positions = facebookPositions;
  }
  if (instagramPositions.length > 0) {
    targeting.instagram_positions = instagramPositions;
  }

  return targeting;
}
