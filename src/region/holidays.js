// Public holidays are data in each RegionProfile ({ date: 'YYYY-MM-DD', name }), in the country's
// own calendar (Colombia moves several to Monday, Japan adds substitute days). The local date is
// taken in the country's time zone, so 20:30 in Bogotá is still that day even if UTC is the next.
export const localDate = (instant, profile) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: profile.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);

export const holidayOn = (instant, profile) => {
  const day = localDate(instant, profile);
  return profile.holidays?.find((holiday) => holiday.date === day) ?? null;
};
