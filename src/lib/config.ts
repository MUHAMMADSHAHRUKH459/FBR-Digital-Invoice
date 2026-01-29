export const config = {
  fbr: {
    baseUrl: process.env.FBR_BASE_URL || "https://gw.fbr.gov.pk/di_data/v1/di",
    token: process.env.FBR_TOKEN!,
    mode: process.env.FBR_MODE || "sandbox",
  },
};