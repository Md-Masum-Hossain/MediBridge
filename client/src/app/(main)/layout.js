import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import AlarmBottomSheet from '@/components/alarm/AlarmBottomSheet';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 pb-20">{children}</div>
      <BottomNav />
      <AlarmBottomSheet />
    </div>
  );
}
