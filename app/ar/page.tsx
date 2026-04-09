import CameraView from "@/components/ar/CameraView";

export default function ARPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-black">
      <div className="relative h-dvh w-full max-w-sm overflow-hidden">
        <CameraView />
      </div>
    </div>
  );
}
