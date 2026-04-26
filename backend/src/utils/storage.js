export function resolvePhotoUrlStrategy(photo) {
  return photo?.image_url ? "public" : "signed_required";
}

export function toPhotoResponse(photo, extra = {}) {
  return {
    ...extra,
    id: photo.id,
    event_id: photo.event_id,
    image_url: photo.image_url || null,
    storage_path: photo.storage_path,
    url_strategy: resolvePhotoUrlStrategy(photo),
  };
}
