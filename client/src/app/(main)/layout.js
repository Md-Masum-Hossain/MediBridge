import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import AlarmBottomSheet from '@/components/alarm/AlarmBottomSheet';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-light selection:text-brand">
      <ServiceWorkerRegister />
      <Header />
      <div className="flex-1 pb-24 max-w-md mx-auto w-full px-4 pt-4">
        {children}
      </div>
      <BottomNav />
      <AlarmBottomSheet />
    </div>
  );
}
