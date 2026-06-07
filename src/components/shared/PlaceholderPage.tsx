interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">{title}</h1>
      {description && <p className="mt-2 text-gray-500">{description}</p>}
    </div>
  )
}
