
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collectionGroup, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, HeartPulse, Percent, CalendarDays, TrendingUp, Users } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number'; // Assuming you have an animated number component
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface VotingStatsProps {
  userId: string;
}

interface VoteData {
    type: 'up' | 'down';
    // Add timestamp if you need date-based calculations
    // timestamp?: Timestamp;
}

interface UserVotingStats {
    totalVotes: number;
    upvotes: number;
    downvotes: number;
    firstVoteDate: Date | null;
    // Add more stats as needed
    // reportsVotedOn: Set<string>; // To track unique reports voted on
}

export const VotingStats: FC<VotingStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<UserVotingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVotingStats = async () => {
      setIsLoading(true);
      let totalVotes = 0;
      let upvotes = 0;
      let downvotes = 0;
      let firstVote: Date | null = null;
      // const reportsVotedOn = new Set<string>();

      try {
         // Query the 'votes' subcollection across all 'reports' documents
         const votesQuery = query(
             collectionGroup(db, 'votes'),
             where('__name__', '>=', `reports/ /votes/${userId}`), // Start path for the user's votes
             where('__name__', '<', `reports/ /votes/${userId}~`) // End path (tilde sorts after user ID)
             // Add orderBy('timestamp', 'asc') if you need the first vote date
         );

         const querySnapshot = await getDocs(votesQuery);

         querySnapshot.forEach((doc) => {
            const vote = doc.data() as VoteData;
            totalVotes++;
            if (vote.type === 'up') {
                upvotes++;
            } else {
                downvotes++;
            }
            // Store report ID if needed for 'people helped' or unique reports
            // const reportId = doc.ref.parent.parent?.id;
            // if (reportId) reportsVotedOn.add(reportId);

            // Track first vote date if timestamp is available
            // if (vote.timestamp) {
            //     const voteDate = vote.timestamp.toDate();
            //     if (!firstVote || voteDate < firstVote) {
            //         firstVote = voteDate;
            //     }
            // }
         });

        setStats({ totalVotes, upvotes, downvotes, firstVoteDate: firstVote });

      } catch (error) {
        console.error("Error fetching voting stats:", error);
        // Handle error appropriately, maybe show a toast
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchVotingStats();
    } else {
        setIsLoading(false); // No user ID, stop loading
    }
  }, [userId]);

  const daysSinceFirstVote = stats?.firstVoteDate ? differenceInDays(new Date(), stats.firstVoteDate) : 0;
  const averageVotesPerDay = (daysSinceFirstVote > 0 && stats?.totalVotes) ? (stats.totalVotes / daysSinceFirstVote) : 0;
  const upvotePercentage = stats?.totalVotes ? (stats.upvotes / stats.totalVotes) * 100 : 0;

  // Simplified "People Helped" - assuming each upvote helps
  const peopleHelped = stats?.upvotes || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg col-span-2" />
      </div>
    );
  }

  if (!stats || stats.totalVotes === 0) {
    return <p className="text-sm text-muted-foreground text-center italic py-4">Aún no has realizado votos.</p>;
  }

  return (
    <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        {/* Total Votes Card */}
        <Card className="bg-muted/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Votos Totales</CardTitle>
                <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-foreground">
                    <AnimatedNumber value={stats.totalVotes} formatOptions={{ maximumFractionDigits: 0 }} />
                </div>
                <p className="text-xs text-muted-foreground">Votos realizados en reportes</p>
            </CardContent>
        </Card>

       {/* Upvotes/Downvotes Card */}
        <Card className="bg-muted/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Distribución</CardTitle>
                 <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex justify-around items-center pt-1">
                     <div className="text-center">
                         <div className="flex items-center justify-center text-green-600">
                             <ArrowUp className="h-4 w-4 mr-1" />
                             <span className="text-xl font-bold">
                                <AnimatedNumber value={stats.upvotes} formatOptions={{ maximumFractionDigits: 0 }} />
                             </span>
                         </div>
                         <p className="text-xs text-muted-foreground">Positivos</p>
                     </div>
                     <div className="text-center">
                         <div className="flex items-center justify-center text-destructive">
                             <ArrowDown className="h-4 w-4 mr-1" />
                             <span className="text-xl font-bold">
                                <AnimatedNumber value={stats.downvotes} formatOptions={{ maximumFractionDigits: 0 }} />
                             </span>
                         </div>
                         <p className="text-xs text-muted-foreground">Negativos</p>
                     </div>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1.5">
                  {upvotePercentage.toFixed(0)}% de votos positivos
                </p>
            </CardContent>
        </Card>

         {/* People Helped Card */}
         {/* Note: This is a simplified metric */}
        <Card className="bg-muted/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Personas Ayudadas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-foreground">
                    <AnimatedNumber value={peopleHelped} formatOptions={{ maximumFractionDigits: 0 }} />
                </div>
                 <p className="text-xs text-muted-foreground">Estimado basado en tus votos positivos</p>
            </CardContent>
        </Card>

        {/* Average Votes Card - Requires firstVoteDate */}
        {stats.firstVoteDate && daysSinceFirstVote >= 1 && (
            <Card className="bg-muted/50 border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Diario</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <div className="text-3xl font-bold text-foreground">
                         <AnimatedNumber value={averageVotesPerDay} formatOptions={{ maximumFractionDigits: 1 }} />
                     </div>
                     <p className="text-xs text-muted-foreground">
                         Votos por día desde {format(stats.firstVoteDate, "P", { locale: es })}
                     </p>
                </CardContent>
            </Card>
         )}
    </motion.div>
  );
};
