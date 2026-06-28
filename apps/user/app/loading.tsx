import { AppLoader } from "@/src/components/next/AppLoader";

export default function Loading() {
  return (
    <main className="flex min-h-[70vh] flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(211_100%_50%_/_0.14),_transparent_30%),radial-gradient(circle_at_80%_12%,_hsl(165_100%_42%_/_0.14),_transparent_26%)] px-4">
      <AppLoader label="Preparing your page" />
    </main>
  );
}
