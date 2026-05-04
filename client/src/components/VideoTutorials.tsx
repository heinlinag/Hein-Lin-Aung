import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  category: 'getting-started' | 'order-management' | 'approval' | 'admin';
}

const TUTORIAL_VIDEOS: VideoTutorial[] = [
  {
    id: 'login-tutorial',
    title: 'How to Login',
    description: 'Learn how to log in to the system using your Employee ID. This tutorial covers both employee and admin login methods.',
    duration: '2:30',
    thumbnail: 'bg-gradient-to-br from-blue-400 to-blue-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'getting-started',
  },
  {
    id: 'submit-order-tutorial',
    title: 'How to Submit an Order',
    description: 'Step-by-step guide on how to submit a new Manual Slitter order with all required fields including Flute Type, Size, Quantity, and BQ Comment.',
    duration: '3:45',
    thumbnail: 'bg-gradient-to-br from-green-400 to-green-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'order-management',
  },
  {
    id: 'approval-center-tutorial',
    title: 'Using the Approval Center',
    description: 'Comprehensive tutorial on how to review, approve, and reject pending requests in the Approval Center. Designed for Level 2 users.',
    duration: '4:15',
    thumbnail: 'bg-gradient-to-br from-orange-400 to-orange-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'approval',
  },
  {
    id: 'stock-history-tutorial',
    title: 'Viewing Stock History',
    description: 'Learn how to view current stock levels, out-of-stock orders, and update usage information from the Stock History page.',
    duration: '3:00',
    thumbnail: 'bg-gradient-to-br from-purple-400 to-purple-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'order-management',
  },
  {
    id: 'admin-panel-tutorial',
    title: 'Admin Panel Overview',
    description: 'Complete guide to the Admin Panel including managing employees, viewing all orders, exporting reports, and system administration tasks.',
    duration: '5:30',
    thumbnail: 'bg-gradient-to-br from-red-400 to-red-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'admin',
  },
  {
    id: 'usage-update-tutorial',
    title: 'Updating Order Usage',
    description: 'Learn how to update the quantity used from an order, including Job No and Old Stock clearance methods.',
    duration: '2:45',
    thumbnail: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'order-management',
  },
];

interface VideoTutorialsProps {
  category?: 'all' | 'getting-started' | 'order-management' | 'approval' | 'admin';
}

export default function VideoTutorials({ category = 'all' }: VideoTutorialsProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(category);

  const filteredVideos = activeCategory === 'all'
    ? TUTORIAL_VIDEOS
    : TUTORIAL_VIDEOS.filter(v => v.category === activeCategory);

  const categoryLabels = {
    'all': 'All Tutorials',
    'getting-started': 'Getting Started',
    'order-management': 'Order Management',
    'approval': 'Approval Workflow',
    'admin': 'Admin Panel',
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'getting-started', 'order-management', 'approval', 'admin'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {categoryLabels[cat as keyof typeof categoryLabels]}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            {/* Thumbnail */}
            <div className={`${video.thumbnail} h-40 relative flex items-center justify-center group`}>
              <button className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <Play size={48} className="text-white fill-white" />
              </button>
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                {video.duration}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
              <div className="mt-3 inline-block">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {categoryLabels[video.category as keyof typeof categoryLabels]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{selectedVideo.title}</h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">{selectedVideo.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {categoryLabels[selectedVideo.category as keyof typeof categoryLabels]}
                </span>
                <span className="text-xs text-gray-500">Duration: {selectedVideo.duration}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
