// app/not-found.tsx

export default function NotFound() {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-4">Sorry, we couldn't find that page.</p>
        <a href="/" className="text-blue-500 underline">Go back home</a>
      </div>
    </div>
  )
}
