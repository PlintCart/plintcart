import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, DollarSign, Users, ShoppingBag, Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.vfs;
import { Badge } from '@/components/ui/badge';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
// ...existing code...
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/AdminLayout';

import { SalesAnalyticsService, ProductSalesAnalytics, SalesMetrics } from '@/services/SalesAnalyticsService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AnalyticsData {
	totalRevenue: number;
	monthlyRevenue: number;
	totalOrders: number;
	monthlyOrders: number;
	averageOrderValue: number;
	topProducts: Array<{
		id: string;
		name: string;
		revenue: number;
		orders: number;
	}>;
	revenueByMonth: Array<{
		month: string;
		revenue: number;
		orders: number;
	}>;
	userGrowth: Array<{
		month: string;
		users: number;
		premiumUsers: number;
	}>;
}

function Analytics() {
	const [user] = useAuthState(auth);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
	const { toast } = useToast();

	useEffect(() => {
		if (user) {
			loadAnalyticsData();
		}
		// eslint-disable-next-line
	}, [user, timeRange]);

	const loadAnalyticsData = async () => {
		if (!user) return;
		try {
			setLoading(true);
			// Fetch sales metrics for the current merchant
			const metrics: SalesMetrics = await SalesAnalyticsService.getSalesMetrics(user.uid);

			// Calculate monthly stats (last 30 days)
			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			let monthlyRevenue = 0;
			let monthlyOrders = 0;
			let revenueByMonth: Array<{ month: string; revenue: number; orders: number }> = [];

			// Aggregate sales by calendar month using stockTransactions
			const transactionsRef = collection(db, 'stockTransactions');
			const transactionsQuery = query(
				transactionsRef,
				where('userId', '==', user.uid),
				where('type', '==', 'sold')
			);
			const transactionsSnapshot = await getDocs(transactionsQuery);
			const transactions = transactionsSnapshot.docs.map(doc => {
				const data = doc.data();
				return {
					quantity: data.quantity,
					timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
					productId: data.productId,
					...data
				};
			});

			// Group by month
			const monthMap: Record<string, { revenue: number; orders: number }> = {};
			transactions.forEach(tx => {
				// Always use a readable month label
				let dateObj = tx.timestamp instanceof Date ? tx.timestamp : (tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp));
				const monthLabel = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
				if (!monthMap[monthLabel]) monthMap[monthLabel] = { revenue: 0, orders: 0 };
				// Get product price (fallback to 0 if not found)
				let price = 0;
				const product = metrics.topSellingProducts.find(p => p.productId === tx.productId);
				if (product && typeof product.price === 'number') price = product.price;
				monthMap[monthLabel].revenue += tx.quantity * price;
				monthMap[monthLabel].orders += tx.quantity;
				// Monthly stats
				if (dateObj >= startOfMonth) {
					monthlyRevenue += tx.quantity * price;
					monthlyOrders += tx.quantity;
				}
			});
			// Only use readable month labels, never Timestamp objects
			revenueByMonth = Object.entries(monthMap).map(([month, data]) => ({ month, ...data }));
			// Sort by year and month
			revenueByMonth.sort((a, b) => {
				const [aMonth, aYear] = a.month.split(' ');
				const [bMonth, bYear] = b.month.split(' ');
				const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
				const aIndex = monthOrder.indexOf(aMonth);
				const bIndex = monthOrder.indexOf(bMonth);
				if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
				return aIndex - bIndex;
			});

			// Top products for display
			const topProducts = metrics.topSellingProducts.map(p => ({
				id: p.productId,
				name: p.productName,
				revenue: p.totalRevenue,
				orders: p.totalSales
			}));

			// User growth placeholder (real user growth would require user registration data)
			const userGrowth = [
				{ month: now.toLocaleString('default', { month: 'short', year: 'numeric' }), users: 0, premiumUsers: 0 }
			];

			setAnalyticsData({
				totalRevenue: metrics.totalRevenue,
				monthlyRevenue,
				totalOrders: metrics.totalOrders,
				monthlyOrders,
				averageOrderValue: metrics.averageOrderValue,
				topProducts,
				revenueByMonth,
				userGrowth
			});
			setLoading(false);
		} catch (error) {
			setLoading(false);
			toast({
				title: 'Error Loading Analytics',
				description: 'Failed to load analytics data',
				variant: 'destructive',
			});
		}
	};

	const exportAnalytics = () => {
		if (!analyticsData) return;
		// Build summary table body
		const summaryBody = [
			['Metric', 'Value', 'Period'],
			['Total Revenue', `KES ${analyticsData.totalRevenue.toLocaleString()}`, 'All Time'],
			['Monthly Revenue', `KES ${analyticsData.monthlyRevenue.toLocaleString()}`, 'This Month'],
			['Total Orders', analyticsData.totalOrders.toString(), 'All Time'],
			['Monthly Orders', analyticsData.monthlyOrders.toString(), 'This Month'],
			['Average Order Value', `KES ${analyticsData.averageOrderValue.toLocaleString()}`, 'Per Order'],
		];

		// Revenue by Month table
		const revenueMonthBody = [
			['Month', 'Revenue', 'Orders'],
			...analyticsData.revenueByMonth.map(m => [m.month, `KES ${m.revenue.toLocaleString()}`, m.orders.toString()]),
		];

		// Top Products table
		const topProductsBody = [
			['Product', 'Revenue', 'Orders'],
			...analyticsData.topProducts.map(p => [p.name, `KES ${p.revenue.toLocaleString()}`, p.orders.toString()]),
		];

		const docDefinition = {
			content: [
				{ text: 'Merchant Analytics Report', style: 'header' },
				{ text: `Time Range: ${timeRange}`, style: 'subheader' },
				{ text: `Generated: ${new Date().toLocaleString()}`, style: 'subheader', margin: [0, 0, 0, 10] },
				{ text: 'Summary', style: 'tableTitle' },
				{ table: { headerRows: 1, widths: ['*', '*', '*'], body: summaryBody }, margin: [0, 0, 0, 10] },
				{ text: 'Revenue by Month', style: 'tableTitle' },
				{ table: { headerRows: 1, widths: ['*', '*', '*'], body: revenueMonthBody }, margin: [0, 0, 0, 10] },
				{ text: 'Top Products', style: 'tableTitle' },
				{ table: { headerRows: 1, widths: ['*', '*', '*'], body: topProductsBody }, margin: [0, 0, 0, 10] },
			],
			styles: {
				header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
				subheader: { fontSize: 12, margin: [0, 0, 0, 4] },
				tableTitle: { fontSize: 14, bold: true, margin: [0, 10, 0, 4] },
			},
		};

		pdfMake.createPdf(docDefinition).download(`analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
		toast({
			title: 'Analytics Exported',
			description: 'PDF report has been downloaded',
		});
	};

	if (loading) {
		return (
			<AdminLayout>
				<div className="space-y-6">
					<div className="flex items-center space-x-2">
						<BarChart3 className="w-8 h-8 animate-pulse" />
						<span>Loading analytics...</span>
					</div>
				</div>
			</AdminLayout>
		);
	}

	if (!analyticsData) {
		return (
			<AdminLayout>
				<div className="text-center py-12">
					<BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
					<p className="text-lg text-muted-foreground">No analytics data available</p>
				</div>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="space-y-6">
				{/* Header - responsive flex-wrap */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
						<p className="text-gray-600">Track your business performance and growth</p>
					</div>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
						{/* Time Range Selector */}
						<div className="flex space-x-2">
							{(['7d', '30d', '90d', '1y'] as const).map((range) => (
								<Button
									key={range}
									variant={timeRange === range ? 'default' : 'outline'}
									size="sm"
									onClick={() => setTimeRange(range)}
								>
									{range === '7d' ? '7 Days' :
									 range === '30d' ? '30 Days' :
									 range === '90d' ? '90 Days' : '1 Year'}
								</Button>
							))}
						</div>
						<Button onClick={exportAnalytics} variant="outline" size="sm">
							<Download className="w-4 h-4 mr-2" />
							Export
						</Button>
					</div>
				</div>

				{/* Key Metrics - responsive grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">KES {analyticsData.totalRevenue.toLocaleString()}</div>
							<p className="text-xs text-muted-foreground">
								KES {analyticsData.monthlyRevenue.toLocaleString()} this month
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
							<ShoppingBag className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
							<p className="text-xs text-muted-foreground">
								{analyticsData.monthlyOrders} this month
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">KES {analyticsData.averageOrderValue.toLocaleString()}</div>
							<p className="text-xs text-muted-foreground">Per completed order</p>
						</CardContent>
					</Card>
				</div>

				{/* Detailed Analytics Tabs */}
				<Tabs defaultValue="revenue" className="space-y-6">
					<TabsList>
						<TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
						<TabsTrigger value="products">Top Products</TabsTrigger>
						<TabsTrigger value="growth">Growth Analysis</TabsTrigger>
					</TabsList>
					<TabsContent value="revenue">
						<Card>
							<CardHeader>
								<CardTitle>Revenue by Month</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{analyticsData.revenueByMonth.map((month, index) => (
										<div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
											<div className="mb-2 sm:mb-0">
												<p className="font-medium">{month.month}</p>
												<p className="text-sm text-gray-600">{month.orders} orders</p>
											</div>
											<div className="text-right">
												<p className="text-lg font-bold">KES {month.revenue.toLocaleString()}</p>
												<div className="w-full sm:w-32 bg-gray-200 rounded-full h-2 mt-1">
													<div 
														className="bg-blue-600 h-2 rounded-full" 
														style={{ width: `${Math.min((month.revenue / Math.max(...analyticsData.revenueByMonth.map(m => m.revenue))) * 100, 100)}%` }}
													></div>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="products">
						<Card>
							<CardHeader>
								<CardTitle>Top Performing Products</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{analyticsData.topProducts.map((product, index) => (
										<div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
											<div className="flex items-center space-x-4 mb-2 sm:mb-0">
												<Badge variant="secondary">#{index + 1}</Badge>
												<div>
													<p className="font-medium">{product.name}</p>
													<p className="text-sm text-gray-600">{product.orders} orders</p>
												</div>
											</div>
											<div className="text-right">
												<p className="text-lg font-bold">KES {product.revenue.toLocaleString()}</p>
												<p className="text-sm text-gray-600">
													KES {(product.revenue / product.orders).toFixed(0)} avg
												</p>
											</div>
										</div>
									))}
									{analyticsData.topProducts.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											No product sales data available
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="growth">
						<Card>
							<CardHeader>
								<CardTitle>Business Growth Metrics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<h3 className="font-medium">Revenue Growth</h3>
										{analyticsData.revenueByMonth.slice(-3).map((month, index) => (
											<div key={index} className="flex justify-between items-center">
												<span className="text-sm">{month.month}</span>
												<span className="font-medium">KES {month.revenue.toLocaleString()}</span>
											</div>
										))}
									</div>
									<div className="space-y-4">
										<h3 className="font-medium">Order Volume</h3>
										{analyticsData.revenueByMonth.slice(-3).map((month, index) => (
											<div key={index} className="flex justify-between items-center">
												<span className="text-sm">{month.month}</span>
												<span className="font-medium">{month.orders} orders</span>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</AdminLayout>
	);
}

export default Analytics;
