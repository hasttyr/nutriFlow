// Admin overrides (tax rates, delivery fee, tip, commission) merged over a country's profile file.
// Shared by the browser and the regional servers.
export const mergeProfile = (base, override) => ({
  ...base,
  tax: { ...base.tax, ...override.tax, rates: { ...base.tax.rates, ...override.tax?.rates } },
  delivery: { ...base.delivery, ...override.delivery },
  tip: { ...base.tip, ...override.tip },
  revenue: { ...base.revenue, ...override.revenue }
});
