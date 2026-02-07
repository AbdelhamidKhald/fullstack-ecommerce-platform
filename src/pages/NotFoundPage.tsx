import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found');
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-8xl font-extrabold text-surface-200 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Page Not Found</h2>
        <p className="text-surface-500 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary gap-2">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
