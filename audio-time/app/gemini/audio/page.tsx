import AudioFile from "@/components/AudioFile";

const AudioPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <AudioFile />
        </div>
      </div>
    </div>
  );
};

export default AudioPage;
