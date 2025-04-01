import { IonSkeletonText } from "@ionic/react";

interface ContentSkeletonProps {
  lines?: number;
}

const ContentSkeleton: React.FC<ContentSkeletonProps> = ({ lines = 3 }) => {
  return (
    <div className="p-4 space-y-4">
      {Array(lines)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="space-y-2">
            <IonSkeletonText
              animated
              style={{
                width: `${Math.random() * 40 + 60}%`,
                height: "20px",
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: `${Math.random() * 20 + 40}%`,
                height: "16px",
              }}
            />
          </div>
        ))}
    </div>
  );
};

export default ContentSkeleton;
