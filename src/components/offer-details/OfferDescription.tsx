interface OfferDescriptionProps {
  description: string;
}

/**
 * OfferDescription component displays the full offer description
 * Renders markdown-formatted text with proper styling
 */
export function OfferDescription({ description }: OfferDescriptionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Opis oferty</h2>

      <div className="prose prose-gray max-w-none">
        {/*
          Description is rendered with whitespace preserved
          For markdown support, consider using a library like react-markdown
          For now, we preserve line breaks and basic formatting
        */}
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</div>
      </div>
    </div>
  );
}
