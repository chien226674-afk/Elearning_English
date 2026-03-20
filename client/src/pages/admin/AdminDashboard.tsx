import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Users, BookOpen, Clock, Trophy, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes, insightsRes] = await Promise.all([
          api.get("/api/admin/stats/overview"),
          api.get("/api/admin/stats/charts"),
          api.get("/api/admin/stats/insights")
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
        setInsights(insightsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const chartConfig = {
    value: {
      label: "Số lượng",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Tổng quan hệ thống</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Người dùng</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Bài học</CardTitle>
            <BookOpen className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Lượt học</CardTitle>
            <Clock className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Thành tựu đạt được</CardTitle>
            <Trophy className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAchievements || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Người dùng mới (7 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ target: { label: "Người dùng", color: "#22c55e" } }} className="h-[300px] w-full">
              <BarChart data={charts?.registrations || []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-target)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Sessions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lượt học (7 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ target: { label: "Lượt học", color: "#3b82f6" } }} className="h-[300px] w-full">
              <AreaChart data={charts?.sessions || []} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="value" fill="var(--color-target)" fillOpacity={0.4} stroke="var(--color-target)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top bài học được học nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.topLessons?.length ? (
                insights.topLessons.map((lesson: any, i: number) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b dark:border-slate-700 last:border-0">
                    <span className="font-medium dark:text-white">{lesson.name}</span>
                    <span className="text-gray-500">{lesson.count} lượt</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top từ phát âm sai nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.topMistakes?.length ? (
                insights.topMistakes.map((word: any, i: number) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b dark:border-slate-700 last:border-0">
                    <span className="font-medium text-red-500">{word.word}</span>
                    <span className="text-gray-500">{word.mistakes} lỗi</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
