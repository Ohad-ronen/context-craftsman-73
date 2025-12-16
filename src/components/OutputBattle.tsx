import { useState, useMemo, useCallback } from 'react';
import { Trophy, Swords, RotateCcw, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fireConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';

interface Experiment {
  id: string;
  name: string;
  goal: string;
  board_name: string;
  output: string;
  rating?: number | null;
}

interface OutputBattleProps {
  experiments: Experiment[];
  onViewExperiment?: (id: string) => void;
}

type GamePhase = 'setup' | 'battle' | 'results';

export const OutputBattle = ({ experiments, onViewExperiment }: OutputBattleProps) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [contenders, setContenders] = useState<Experiment[]>([]);
  const [currentPair, setCurrentPair] = useState<[Experiment, Experiment] | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds, setTotalRounds] = useState(0);
  const [winner, setWinner] = useState<Experiment | null>(null);
  const [animatingChoice, setAnimatingChoice] = useState<'left' | 'right' | null>(null);

  // Get unique goals
  const goals = useMemo(() => {
    const uniqueGoals = new Set(experiments.filter(e => e.output?.trim()).map(e => e.goal));
    return Array.from(uniqueGoals).filter(Boolean).sort();
  }, [experiments]);

  // Get boards for selected goal
  const boards = useMemo(() => {
    if (!selectedGoal) return [];
    const uniqueBoards = new Set(
      experiments
        .filter(e => e.goal === selectedGoal && e.output?.trim())
        .map(e => e.board_name)
    );
    return Array.from(uniqueBoards).filter(Boolean).sort();
  }, [experiments, selectedGoal]);

  // Get eligible experiments
  const eligibleExperiments = useMemo(() => {
    return experiments.filter(
      e => e.goal === selectedGoal && e.board_name === selectedBoard && e.output?.trim()
    );
  }, [experiments, selectedGoal, selectedBoard]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startBattle = useCallback(() => {
    const shuffled = shuffleArray(eligibleExperiments);
    setContenders(shuffled.slice(2));
    setCurrentPair([shuffled[0], shuffled[1]]);
    setTotalRounds(shuffled.length - 1);
    setRoundNumber(1);
    setGamePhase('battle');
    setWinner(null);
  }, [eligibleExperiments]);

  const handleChoice = useCallback((choice: 'left' | 'right') => {
    if (!currentPair) return;
    
    setAnimatingChoice(choice);
    
    setTimeout(() => {
      const winnerExp = choice === 'left' ? currentPair[0] : currentPair[1];
      
      if (contenders.length === 0) {
        setWinner(winnerExp);
        setGamePhase('results');
        fireConfetti();
      } else {
        const nextChallenger = contenders[0];
        setContenders(contenders.slice(1));
        setCurrentPair([winnerExp, nextChallenger]);
        setRoundNumber(r => r + 1);
      }
      setAnimatingChoice(null);
    }, 300);
  }, [currentPair, contenders]);

  const resetGame = useCallback(() => {
    setGamePhase('setup');
    setSelectedGoal('');
    setSelectedBoard('');
    setContenders([]);
    setCurrentPair(null);
    setWinner(null);
    setRoundNumber(1);
  }, []);

  const playAgain = useCallback(() => {
    startBattle();
  }, [startBattle]);

  // Setup Phase
  if (gamePhase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Output Battle</h2>
          <p className="text-muted-foreground">Find the best output through head-to-head comparison</p>
        </div>

        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Goal</label>
              <Select value={selectedGoal} onValueChange={(v) => { setSelectedGoal(v); setSelectedBoard(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a goal..." />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Board</label>
              <Select value={selectedBoard} onValueChange={setSelectedBoard} disabled={!selectedGoal}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedGoal ? "Choose a board..." : "Select goal first"} />
                </SelectTrigger>
                <SelectContent>
                  {boards.map(board => (
                    <SelectItem key={board} value={board}>{board}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGoal && selectedBoard && (
              <div className="pt-2">
                <Badge variant={eligibleExperiments.length >= 2 ? "default" : "secondary"}>
                  {eligibleExperiments.length} experiment{eligibleExperiments.length !== 1 ? 's' : ''} available
                </Badge>
                {eligibleExperiments.length < 2 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Need at least 2 experiments to start a battle
                  </p>
                )}
              </div>
            )}

            <Button 
              className="w-full mt-4" 
              size="lg"
              disabled={eligibleExperiments.length < 2}
              onClick={startBattle}
            >
              <Swords className="w-4 h-4 mr-2" />
              Start Battle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Battle Phase
  if (gamePhase === 'battle' && currentPair) {
    return (
      <div className="flex flex-col h-full p-4 md:p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Round {roundNumber} of {totalRounds}</Badge>
            <Badge variant="secondary">{contenders.length + 2} remaining</Badge>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold">Which output is better?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedGoal} • {selectedBoard}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0">
          {(['left', 'right'] as const).map((side, idx) => {
            const exp = currentPair[idx];
            const isAnimatingOut = animatingChoice && animatingChoice !== side;
            const isAnimatingIn = animatingChoice === side;
            
            return (
              <Card 
                key={exp.id}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-primary hover:shadow-lg flex flex-col",
                  isAnimatingOut && "opacity-0 scale-95",
                  isAnimatingIn && "ring-2 ring-primary shadow-lg scale-[1.02]"
                )}
                onClick={() => handleChoice(side)}
              >
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">Option {side === 'left' ? 'A' : 'B'}</Badge>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {exp.name}
                    </span>
                  </div>
                  <ScrollArea className="flex-1 min-h-[300px] max-h-[50vh]">
                    <div className="text-sm whitespace-pre-wrap pr-4">
                      {exp.output}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Click on the better output to advance it to the next round
        </p>
      </div>
    );
  }

  // Results Phase
  if (gamePhase === 'results' && winner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-4 animate-scale-in">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Champion Found!</h2>
          <p className="text-muted-foreground">
            After {totalRounds} rounds, we have a winner
          </p>
        </div>

        <Card className="w-full max-w-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">{winner.name}</span>
              {winner.rating && (
                <Badge variant="secondary">Rating: {winner.rating}/10</Badge>
              )}
            </div>
            <ScrollArea className="max-h-[40vh]">
              <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                {winner.output}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={playAgain}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          <Button variant="outline" onClick={resetGame}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Filters
          </Button>
          {onViewExperiment && (
            <Button variant="secondary" onClick={() => onViewExperiment(winner.id)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Experiment
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
