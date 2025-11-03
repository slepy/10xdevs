import { useState } from "react";

interface OfferImageGalleryProps {
  images: string[];
  offerName: string;
}

/**
 * OfferImageGallery component displays a main image with thumbnail navigation
 * Users can click thumbnails to change the main displayed image
 */
export function OfferImageGallery({ images, offerName }: OfferImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const selectedImageUrl = images[selectedImageIndex];

  return (
    <div className="space-y-4">
      {/* Main image display */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src={selectedImageUrl}
          alt={`${offerName} - zdjęcie ${selectedImageIndex + 1} z ${images.length}`}
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />

        {/* Image counter badge */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          {selectedImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail navigation - only show if more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2" role="tablist">
          {images.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              role="tab"
              aria-selected={selectedImageIndex === index}
              aria-label={`Pokaż zdjęcie ${index + 1}`}
              onClick={() => setSelectedImageIndex(index)}
              className={`
                relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all
                ${
                  selectedImageIndex === index
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <img
                src={imageUrl}
                alt={`${offerName} - miniaturka ${index + 1}`}
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />

              {/* Selected indicator overlay */}
              {selectedImageIndex === index && <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
