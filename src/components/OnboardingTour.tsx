import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Welcome to Agent Tracker! 🎉</h2>
        <p className="text-muted-foreground">
          Let's take a quick tour to help you get started with tracking and evaluating your AI experiments.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="trigger-workflow"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Start a New Experiment</h3>
        <p className="text-sm text-muted-foreground">
          Fill in your goal, mission, example, and rules to trigger an n8n workflow that generates experiments automatically.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="view-modes"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">View Your Experiments</h3>
        <p className="text-sm text-muted-foreground">
          Switch between Dashboard, Cards, Table, Compare, and AI Insights views to analyze your experiments from different angles.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="ai-tools"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">AI-Powered Tools</h3>
        <p className="text-sm text-muted-foreground">
          Use Bulk Evaluate to automatically rate all unrated experiments at once. The AI will assess relevance, accuracy, clarity, and more.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="tag-filters"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Organize with Tags</h3>
        <p className="text-sm text-muted-foreground">
          Create and assign tags to categorize experiments. Filter by tags to focus on specific experiment groups.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="notifications"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Notification Center</h3>
        <p className="text-sm text-muted-foreground">
          Get notified when teammates mention you in annotations or chat messages. Click the bell to see your notifications.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="team-chat"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Team Collaboration</h3>
        <p className="text-sm text-muted-foreground">
          Chat with your team in real-time. Use @mentions to notify people, #experiment to link experiments, and react with emojis!
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">You're All Set! ✨</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Pro tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd> anytime to see keyboard shortcuts.
        </p>
        <p className="text-sm text-muted-foreground">
          You can restart this tour anytime from your Profile Settings.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

export function OnboardingTour({ run: externalRun, onComplete }: OnboardingTourProps) {
  const { user, profile } = useAuth();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // If external run is provided, use it; otherwise check profile
    if (externalRun !== undefined) {
      setRun(externalRun);
    } else if (profile && profile.has_completed_tour === false) {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => setRun(true), 500);
      return () => clearTimeout(timer);
    }
  }, [profile, externalRun]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);
      
      // Update database
      if (user) {
        await supabase
          .from('profiles')
          .update({ has_completed_tour: true })
          .eq('id', user.id);
      }
      
      onComplete?.();
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Handle step navigation
      const newIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(newIndex);
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      spotlightClicks
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--card))',
          textColor: 'hsl(var(--card-foreground))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '0.75rem',
          padding: '1rem',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: '0.5rem',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Get Started',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
