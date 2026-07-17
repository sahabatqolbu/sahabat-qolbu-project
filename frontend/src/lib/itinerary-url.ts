export const getItineraryPreviewUrl = (slug: string) =>
  `/itinerary/${encodeURIComponent(slug)}`;

export const getItineraryDownloadUrl = (slug: string) =>
  `/api/itinerary/${encodeURIComponent(slug)}/download`;
