import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import AlarmBottomSheet from '@/components/alarm/AlarmBottomSheet';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-light selection:text-brand">
      <ServiceWorkerRegister />
      <Header />
      {/* Mobile: pb-24 for bottom nav clearance. Desktop: pb-8, no bottom nav */}
      <div className="flex-1 pb-24 md:pb-8 w-full">
        {children}
      </div>
      <BottomNav />
      <AlarmBottomSheet />
    </div>
  );
}
