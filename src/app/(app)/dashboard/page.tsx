import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';
import Image from 'next/image';

// Mock data - replace with actual data fetching
const summaryData = {
  totalBalance: 12530.75,
  totalIncome: 5200.00,
  totalExpenses: 2800.50,
  recentTransactions: 5,
};

const StatCard = ({ title, value, icon: Icon, currency = false, dataAiHint }: { title: string; value: string | number; icon: React.ElementType; currency?: boolean, dataAiHint?: string }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {currency && '$'}{typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
      </div>
      {dataAiHint && <div className="text-xs text-muted-foreground" data-ai-hint={dataAiHint}>Hint for AI image generation</div>}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your financial activity." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Balance" value={summaryData.totalBalance} icon={DollarSign} currency dataAiHint="piggy bank" />
        <StatCard title="Monthly Income" value={summaryData.totalIncome} icon={Users} currency dataAiHint="money rain" />
        <StatCard title="Monthly Expenses" value={summaryData.totalExpenses} icon={CreditCard} currency dataAiHint="empty wallet" />
        <StatCard title="Recent Transactions" value={summaryData.recentTransactions} icon={Activity} dataAiHint="graph chart" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Placeholder for recent transactions list or chart.</p>
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Recent Activity Placeholder" 
              width={600} 
              height={300} 
              className="mt-4 rounded-md object-cover"
              data-ai-hint="financial report" 
            />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Placeholder for spending by category chart.</p>
             <Image 
              src="https://placehold.co/600x300.png" 
              alt="Spending Overview Placeholder" 
              width={600} 
              height={300} 
              className="mt-4 rounded-md object-cover"
              data-ai-hint="pie chart"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
