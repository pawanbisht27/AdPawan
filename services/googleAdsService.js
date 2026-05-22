const { GoogleAdsApi } = require("google-ads-api");
const GoogleIntegration = require("../models/GoogleIntegration");

const cleanCustomerId = (id) => String(id || "").replace(/-/g, "");

// Build a customer object from userId
const getCustomer = async (userId) => {
  const integration = await GoogleIntegration.findOne({ user: userId });

  if (!integration || !integration.refreshToken) {
    throw new Error("Google Ads not connected");
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
  });

  return client.Customer({
    customer_id: cleanCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID),
    refresh_token: integration.refreshToken,
    login_customer_id: cleanCustomerId(process.env.GOOGLE_MANAGER_CUSTOMER_ID),
  });
};

// ─── CAMPAIGNS ─────────────────────────────────────────────────────────────

exports.getCampaigns = async (userId) => {
  const customer = await getCustomer(userId);

  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.start_date,
      campaign.end_date,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.id DESC
  `);

  return rows.map((row) => ({
    id: row.campaign.id.toString(),
    name: row.campaign.name,
    status: row.campaign.status,
    type: row.campaign.advertising_channel_type,
    startDate: row.campaign.start_date,
    endDate: row.campaign.end_date,
    budget: (row.campaign_budget?.amount_micros || 0) / 1_000_000,
    metrics: {
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost: (row.metrics.cost_micros || 0) / 1_000_000,
      conversions: row.metrics.conversions || 0,
      ctr: parseFloat((row.metrics.ctr || 0).toFixed(4)),
      avgCpc: (row.metrics.average_cpc || 0) / 1_000_000,
    },
  }));
};

exports.createCampaign = async (userId, { name, type, budgetAmount, startDate, endDate, biddingStrategy }) => {
  const customer = await getCustomer(userId);

  const budgetRes = await customer.campaignBudgets.create([{
    name: `${name} Budget`,
    amount_micros: Math.round(budgetAmount * 1_000_000),
    delivery_method: "STANDARD",
  }]);

  let bidding = {};
  if (biddingStrategy === "MAXIMIZE_CONVERSIONS") bidding = { maximize_conversions: {} };
  else if (biddingStrategy === "TARGET_CPA") bidding = { target_cpa: { target_cpa_micros: 500_000_000 } };
  else bidding = { manual_cpc: { enhanced_cpc_enabled: true } };

  const res = await customer.campaigns.create([{
    name,
    advertising_channel_type: type || "SEARCH",
    campaign_budget: budgetRes.results[0].resource_name,
    status: "PAUSED",
    start_date: startDate || new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    end_date: endDate || null,
    ...bidding,
    network_settings: {
      target_google_search: true,
      target_search_network: type !== "DISPLAY",
      target_content_network: type === "DISPLAY",
    },
  }]);

  return { campaignId: res.results[0].resource_name.split("/").pop() };
};

exports.updateCampaign = async (userId, campaignId, updates) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const payload = { resource_name: `customers/${cId}/campaigns/${campaignId}` };
  if (updates.name) payload.name = updates.name;
  if (updates.status) payload.status = updates.status;
  if (updates.endDate) payload.end_date = updates.endDate;
  await customer.campaigns.update([payload]);
  return { success: true };
};

exports.updateBudget = async (userId, campaignId, newBudget) => {
  const customer = await getCustomer(userId);
  const rows = await customer.query(`
    SELECT campaign_budget.resource_name
    FROM campaign WHERE campaign.id = ${campaignId} LIMIT 1
  `);
  if (!rows.length) throw new Error("Campaign not found");
  await customer.campaignBudgets.update([{
    resource_name: rows[0].campaign_budget.resource_name,
    amount_micros: Math.round(newBudget * 1_000_000),
  }]);
  return { success: true, newBudget };
};

// ─── AD GROUPS ─────────────────────────────────────────────────────────────

exports.getAdGroups = async (userId, campaignId) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const rows = await customer.query(`
    SELECT
      ad_group.id, ad_group.name, ad_group.status,
      ad_group.type, ad_group.cpc_bid_micros,
      metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions
    FROM ad_group
    WHERE ad_group.campaign = 'customers/${cId}/campaigns/${campaignId}'
      AND ad_group.status != 'REMOVED'
  `);

  return rows.map((row) => ({
    id: row.ad_group.id.toString(),
    name: row.ad_group.name,
    status: row.ad_group.status,
    type: row.ad_group.type,
    cpcBid: (row.ad_group.cpc_bid_micros || 0) / 1_000_000,
    metrics: {
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost: (row.metrics.cost_micros || 0) / 1_000_000,
      conversions: row.metrics.conversions || 0,
    },
  }));
};

exports.createAdGroup = async (userId, { campaignId, name, cpcBid, type }) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const res = await customer.adGroups.create([{
    name,
    campaign: `customers/${cId}/campaigns/${campaignId}`,
    type: type || "SEARCH_STANDARD",
    status: "ENABLED",
    cpc_bid_micros: Math.round((cpcBid || 1) * 1_000_000),
  }]);

  return { adGroupId: res.results[0].resource_name.split("/").pop() };
};

// ─── ADS ───────────────────────────────────────────────────────────────────

exports.createSearchAd = async (userId, { adGroupId, headlines, descriptions, finalUrl, path1, path2 }) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const res = await customer.adGroupAds.create([{
    ad_group: `customers/${cId}/adGroups/${adGroupId}`,
    status: "ENABLED",
    ad: {
      final_urls: [finalUrl],
      responsive_search_ad: {
        headlines: headlines.map((text) => ({ text })),
        descriptions: descriptions.map((text) => ({ text })),
        path1: path1 || "",
        path2: path2 || "",
      },
    },
  }]);

  return { adId: res.results[0].resource_name.split("/").pop() };
};

exports.createDisplayAd = async (userId, { adGroupId, headlines, descriptions, businessName, finalUrl, imageUrls, logoUrls }) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const res = await customer.adGroupAds.create([{
    ad_group: `customers/${cId}/adGroups/${adGroupId}`,
    status: "ENABLED",
    ad: {
      final_urls: [finalUrl],
      responsive_display_ad: {
        headlines: headlines.map((text) => ({ text })),
        descriptions: descriptions.map((text) => ({ text })),
        business_name: businessName,
        marketing_images: (imageUrls || []).map((url) => ({ url })),
        logo_images: (logoUrls || []).map((url) => ({ url })),
        call_to_action_text: "Learn More",
      },
    },
  }]);

  return { adId: res.results[0].resource_name.split("/").pop() };
};

exports.createShoppingCampaign = async (userId, { name, budgetAmount, merchantId, targetCountry }) => {
  const customer = await getCustomer(userId);

  const budgetRes = await customer.campaignBudgets.create([{
    name: `${name} Budget`,
    amount_micros: Math.round(budgetAmount * 1_000_000),
    delivery_method: "STANDARD",
  }]);

  const res = await customer.campaigns.create([{
    name,
    advertising_channel_type: "SHOPPING",
    campaign_budget: budgetRes.results[0].resource_name,
    status: "PAUSED",
    shopping_setting: {
      merchant_id: parseInt(merchantId),
      sales_country: targetCountry || "IN",
      campaign_priority: 0,
    },
    maximize_conversion_value: {},
  }]);

  return { campaignId: res.results[0].resource_name.split("/").pop() };
};

// ─── KEYWORDS ──────────────────────────────────────────────────────────────

exports.getKeywords = async (userId, adGroupId) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const rows = await customer.query(`
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.cpc_bid_micros,
      metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions
    FROM keyword_view
    WHERE ad_group_criterion.ad_group = 'customers/${cId}/adGroups/${adGroupId}'
      AND ad_group_criterion.status != 'REMOVED'
  `);

  return rows.map((row) => ({
    id: row.ad_group_criterion.criterion_id.toString(),
    text: row.ad_group_criterion.keyword.text,
    matchType: row.ad_group_criterion.keyword.match_type,
    status: row.ad_group_criterion.status,
    qualityScore: row.ad_group_criterion.quality_info?.quality_score || null,
    cpcBid: (row.ad_group_criterion.cpc_bid_micros || 0) / 1_000_000,
    metrics: {
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost: (row.metrics.cost_micros || 0) / 1_000_000,
      conversions: row.metrics.conversions || 0,
    },
  }));
};

exports.addKeywords = async (userId, adGroupId, keywords) => {
  const customer = await getCustomer(userId);
  const cId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const res = await customer.adGroupCriteria.create(
    keywords.map((kw) => ({
      ad_group: `customers/${cId}/adGroups/${adGroupId}`,
      status: "ENABLED",
      keyword: { text: kw.text, match_type: kw.matchType || "BROAD" },
      cpc_bid_micros: kw.bid ? Math.round(kw.bid * 1_000_000) : undefined,
    }))
  );

  return res.results.map((r) => ({ resourceName: r.resource_name }));
};

exports.getKeywordSuggestions = async (userId, { keywords, url, language, country }) => {
  const customer = await getCustomer(userId);

  const result = await customer.keywordPlanIdeaService.generateKeywordIdeas({
    language: `languageConstants/${language || "1000"}`,
    geo_target_constants: [`geoTargetConstants/${country || "2356"}`],
    keyword_seed: { keywords: Array.isArray(keywords) ? keywords : [keywords] },
    url_seed: url ? { url } : undefined,
  });

  return (result.results || []).slice(0, 30).map((idea) => ({
    text: idea.text,
    avgMonthlySearches: idea.keyword_idea_metrics?.avg_monthly_searches?.toString() || "0",
    competition: idea.keyword_idea_metrics?.competition || "UNSPECIFIED",
    competitionIndex: idea.keyword_idea_metrics?.competition_index || 0,
    lowBid: (idea.keyword_idea_metrics?.low_top_of_page_bid_micros || 0) / 1_000_000,
    highBid: (idea.keyword_idea_metrics?.high_top_of_page_bid_micros || 0) / 1_000_000,
  }));
};

// ─── ANALYTICS ─────────────────────────────────────────────────────────────

exports.getCampaignAnalytics = async (userId, campaignId, { startDate, endDate }) => {
  const customer = await getCustomer(userId);
  const dateClause = startDate && endDate
    ? `AND segments.date BETWEEN '${startDate}' AND '${endDate}'` : "";

  const rows = await customer.query(`
    SELECT
      segments.date,
      metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions,
      metrics.ctr, metrics.average_cpc,
      metrics.cost_per_conversion, metrics.conversion_rate
    FROM campaign
    WHERE campaign.id = ${campaignId} ${dateClause}
    ORDER BY segments.date
  `);

  return rows.map((row) => ({
    date: row.segments.date,
    impressions: row.metrics.impressions || 0,
    clicks: row.metrics.clicks || 0,
    cost: (row.metrics.cost_micros || 0) / 1_000_000,
    conversions: row.metrics.conversions || 0,
    ctr: parseFloat((row.metrics.ctr || 0).toFixed(4)),
    avgCpc: (row.metrics.average_cpc || 0) / 1_000_000,
    costPerConversion: (row.metrics.cost_per_conversion || 0) / 1_000_000,
    conversionRate: parseFloat((row.metrics.conversion_rate || 0).toFixed(4)),
  }));
};

exports.getAccountOverview = async (userId) => {
  const customer = await getCustomer(userId);
  const rows = await customer.query(`
    SELECT
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.ctr, metrics.average_cpc,
      metrics.cost_per_conversion
    FROM customer
  `);
  if (!rows.length) return {};
  const m = rows[0].metrics;
  return {
    impressions: m.impressions || 0,
    clicks: m.clicks || 0,
    cost: (m.cost_micros || 0) / 1_000_000,
    conversions: m.conversions || 0,
    ctr: parseFloat((m.ctr || 0).toFixed(4)),
    avgCpc: (m.average_cpc || 0) / 1_000_000,
    costPerConversion: (m.cost_per_conversion || 0) / 1_000_000,
  };
};

// ─── CONVERSION TRACKING ───────────────────────────────────────────────────

exports.createConversionAction = async (userId, { name, type, value, currency }) => {
  const customer = await getCustomer(userId);

  const res = await customer.conversionActions.create([{
    name,
    type: type || "WEBPAGE",
    status: "ENABLED",
    default_value: value || 0,
    default_currency_code: currency || "INR",
    value_settings: {
      default_value: value || 0,
      default_currency_code: currency || "INR",
      always_use_default_value: !value,
    },
    counting_type: "ONE_PER_CLICK",
  }]);

  return { conversionActionId: res.results[0].resource_name.split("/").pop() };
};

exports.getConversionActions = async (userId) => {
  const customer = await getCustomer(userId);

  const rows = await customer.query(`
    SELECT
      conversion_action.id, conversion_action.name,
      conversion_action.type, conversion_action.status,
      conversion_action.tag_snippets,
      metrics.conversions, metrics.all_conversions
    FROM conversion_action
    WHERE conversion_action.status != 'REMOVED'
  `);

  return rows.map((row) => ({
    id: row.conversion_action.id.toString(),
    name: row.conversion_action.name,
    type: row.conversion_action.type,
    status: row.conversion_action.status,
    globalSiteTag: row.conversion_action.tag_snippets?.[0]?.global_site_tag || null,
    eventSnippet: row.conversion_action.tag_snippets?.[0]?.event_snippet || null,
    conversions: row.metrics.conversions || 0,
    allConversions: row.metrics.all_conversions || 0,
  }));
};