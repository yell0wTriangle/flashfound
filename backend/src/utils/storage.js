export function resolvePhotoUrlStrategy(photo) {
  return photo?.image_url ? "public" : "signed_required";
}

export function toPhotoResponse(photo, extra = {}) {
  const resolvedImageUrl =
    Object.prototype.hasOwnProperty.call(extra, "image_url") && extra.image_url
      ? extra.image_url
      : photo.image_url || null;
  const resolvedUrlStrategy = resolvedImageUrl ? "public" : resolvePhotoUrlStrategy(photo);

  return {
    ...extra,
    id: photo.id,
    event_id: photo.event_id,
    image_url: resolvedImageUrl,
    storage_path: photo.storage_path,
    url_strategy: resolvedUrlStrategy,
    face_processing_status: photo.face_processing_status ?? extra.face_processing_status,
    face_processing_error: photo.face_processing_error ?? null,
    face_processed_at: photo.face_processed_at ?? null,
  };
}
