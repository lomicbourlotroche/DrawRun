'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '@/components/ui';
import { Activity } from '@/types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Calendar, Activity as ActivityIcon 
} from 'lucide-react';

interface ProgressionData {
  date: string;
  distance: number;
  pace: number;
  duration: number;
  elevation: number;
  week: string;
}

interface ProgressionChartProps {
  activities: Activity[];
  sport: 'run' | 'bike' | 'swim';
}

export function ProgressionChart({ activities, sport }: ProgressionChartProps) {
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year' | 'all'>('6months');
  const [metric, setMetric] = useState<'distance' | 'pace' | 'duration' | 'elevation'>('distance');
  const [showComparison, setShowComparison] = useState(false);
  const [progressionData, setProgressionData] = useState<ProgressionData[]>([]);
  const [comparisonData, setComparisonData] = useState<ProgressionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter activities by sport and time range
  const filteredActivities = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        cutoffDate.setFullYear(2000); // Very old date
        break;
    }
    
    return (activities ?? [])
      .filter(activity => activity.type === sport)
      .filter(activity => new Date(activity.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, sport, timeRange]);

  // Process data for charts
  useEffect(() => {
    const processData = () => {
      setIsLoading(true);
      
      const weeklyData = new Map<string, ProgressionData>();
      
      filteredActivities.forEach(activity => {
        const date = new Date(activity.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            date: weekKey,
            distance: 0,
            pace: 0,
            duration: 0,
            elevation: 0,
            week: `Sem ${Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
          });
        }
        
        const weekData = weeklyData.get(weekKey)!;
        weekData.distance += activity.distance / 1000; // Convert to km
        weekData.duration += (activity.moving_time || 0) / 3600; // Convert to hours
        weekData.elevation += activity.total_elevation_gain || 0;
      });
      
      // Calculate pace (min/km) for each week
      weeklyData.forEach(weekData => {
        if (weekData.distance > 0) {
          weekData.pace = (weekData.duration * 60) / weekData.distance; // min/km
        }
      });
      
      setProgressionData(Array.from(weeklyData.values()));
      
      // Process comparison data (previous year)
      if (showComparison) {
        const now = new Date();
        const comparisonActivities = activities
          .filter(activity => activity.type === sport)
          .filter(activity => {
            const activityDate = new Date(activity.date);
            const comparisonDate = new Date(activityDate);
            comparisonDate.setFullYear(activityDate.getFullYear() - 1);
            
            const cutoffDate = new Date();
            switch (timeRange) {
              case '3months':
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
              case '6months':
                cutoffDate.setMonth(now.getMonth() - 6);
                break;
              case '1year':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
              case 'all':
                cutoffDate.setFullYear(2000);
                break;
            }
            
            return comparisonDate >= cutoffDate;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const comparisonWeeklyData = new Map<string, ProgressionData>();
        
        comparisonActivities.forEach(activity => {
          const date = new Date(activity.date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!comparisonWeeklyData.has(weekKey)) {
            comparisonWeeklyData.set(weekKey, {
              date: weekKey,
              distance: 0,
              pace: 0,
              duration: 0,
              elevation: 0,
              week: `Sem ${Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
            });
          }
          
          const weekData = comparisonWeeklyData.get(weekKey)!;
          weekData.distance += activity.distance / 1000;
          weekData.duration += (activity.moving_time || 0) / 3600;
          weekData.elevation += activity.total_elevation_gain || 0;
        });
        
        comparisonWeeklyData.forEach(weekData => {
          if (weekData.distance > 0) {
            weekData.pace = (weekData.duration * 60) / weekData.distance;
          }
        });
        
        setComparisonData(Array.from(comparisonWeeklyData.values()));
      } else {
        setComparisonData([]);
      }
      
      setIsLoading(false);
    };
    
    processData();
  }, [filteredActivities, showComparison, activities, sport, timeRange]);

  // Format data for display
  const chartData = useMemo(() => {
    return progressionData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      distance: Number(item.distance.toFixed(1)),
      pace: Number(item.pace.toFixed(1)),
      duration: Number(item.duration.toFixed(1)),
      elevation: Number(item.elevation)
    }));
  }, [progressionData]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { value: 0, direction: 'neutral' as const };
    
    const recent = chartData.slice(-4);
    const older = chartData.slice(-8, -4);
    
    if (older.length === 0) return { value: 0, direction: 'neutral' as const };
    
    const recentAvg = recent.reduce((sum, item) => sum + item[metric], 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item[metric], 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      value: Math.abs(change),
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral' as const
    };
  }, [chartData, metric]);

  const metricConfig = {
    distance: { label: 'Distance (km)', color: 'var(--primary)', unit: 'km' },
    pace: { label: 'Rythme (min/km)', color: 'var(--success)', unit: 'min/km' },
    duration: { label: 'Durée (h)', color: 'var(--peak)', unit: 'h' },
    elevation: { label: 'Dénivelé (m)', color: 'var(--secondary)', unit: 'm' }
  };

  const currentConfig = metricConfig[metric];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Progression {sport === 'run' ? 'Course' : sport === 'bike' ? 'Vélo' : 'Natation'}
          </CardTitle>
          <div className="flex gap-2">
            <Select
              value={timeRange}
              onChange={(value) => setTimeRange(value as 'all' | '3months' | '6months' | '1year')}
              options={[
                { value: '3months', label: '3 mois' },
                { value: '6months', label: '6 mois' },
                { value: '1year', label: '1 an' },
                { value: 'all', label: 'Tout' }
              ]}
            />
            <Select
              value={metric}
              onChange={(value) => setMetric(value as 'distance' | 'pace' | 'duration' | 'elevation')}
              options={[
                { value: 'distance', label: 'Distance' },
                { value: 'pace', label: 'Rythme' },
                { value: 'duration', label: 'Durée' },
                { value: 'elevation', label: 'Dénivelé' }
              ]}
            />
            <Button
              variant={showComparison ? "primary" : "secondary"}
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Comparer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Trend indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-muted" />
              <span className="text-sm font-medium">Tendance</span>
            </div>
            <div className="flex items-center gap-2">
              {trend.direction === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
              {trend.direction === 'down' && <TrendingUp className="w-4 h-4 text-danger rotate-180" />}
              <span className={`text-sm font-medium ${
                trend.direction === 'up' ? 'text-success' : 
                trend.direction === 'down' ? 'text-danger' : 
                'text-muted'
              }`}>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {trend.value.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Chart */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: currentConfig.label, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} ${currentConfig.unit}`, 
                    name === 'current' ? 'Cette année' : 'Année dernière'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={metric} 
                  name="current"
                  stroke={currentConfig.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                {showComparison && comparisonData.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey={metric} 
                    name="previous"
                    data={comparisonData.map(item => ({
                      ...item,
                      date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
                      [metric]: Number(item[metric].toFixed(1))
                    }))}
                    stroke="var(--muted)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted">
              <div className="text-center">
                <ActivityIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune activité {sport === 'run' ? 'de course' : sport === 'bike' ? 'à vélo' : 'de natation'} sur cette période</p>
              </div>
            </div>
          )}

          {/* Stats summary */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted">Total</p>
                <p className="text-lg font-bold text-foreground">
                  {chartData.reduce((sum, item) => sum + item[metric], 0).toFixed(1)} {currentConfig.unit}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted">Moyenne</p>
                <p className="text-lg font-bold text-foreground">
                  {(chartData.reduce((sum, item) => sum + item[metric], 0) / chartData.length).toFixed(1)} {currentConfig.unit}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted">Maximum</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.max(...chartData.map(item => item[metric])).toFixed(1)} {currentConfig.unit}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
