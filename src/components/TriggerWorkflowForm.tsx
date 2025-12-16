import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Play, Loader2, Plus } from "lucide-react";

const N8N_WEBHOOK_URL = "https://boardsai.app.n8n.cloud/webhook/575b5dc9-dbd9-4113-81fd-8fea8342f97d";

interface WorkflowFormData {
  goal: string;
  mission: string;
  example: string;
  rules: string;
}

interface TriggerWorkflowFormProps {
  collapsed?: boolean;
}

export function TriggerWorkflowForm({ collapsed = false }: TriggerWorkflowFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WorkflowFormData>({
    goal: "",
    mission: "",
    example: "",
    rules: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.goal.trim() || !formData.mission.trim()) {
      toast.error("Goal and Mission are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const params = new URLSearchParams({
        goal: formData.goal,
        mission: formData.mission,
        example: formData.example,
        rules: formData.rules,
      });

      const response = await fetch(`${N8N_WEBHOOK_URL}?${params.toString()}`, {
        method: "GET",
      });

      if (response.ok) {
        toast.success("Workflow triggered successfully! Agents are now running.");
        setFormData({ goal: "", mission: "", example: "", rules: "" });
        setIsOpen(false);
      } else {
        toast.error("Failed to trigger workflow");
      }
    } catch (error) {
      console.error("Error triggering workflow:", error);
      toast.error("Failed to connect to n8n workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerButton = (
    <DialogTrigger asChild>
      <Button 
        className={collapsed ? "w-8 h-8 p-0" : "gap-2 w-full"}
        size={collapsed ? "icon" : "default"}
      >
        <Plus className="w-4 h-4" />
        {!collapsed && "New Experiment"}
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {triggerButton}
          </TooltipTrigger>
          <TooltipContent side="right">
            New Experiment
          </TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Trigger Experiment Workflow
          </DialogTitle>
          <DialogDescription>
            Start an n8n workflow to run agents. Results will be added as new experiments when complete.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Goal of the Experiment *</Label>
            <Input
              id="goal"
              placeholder="What are you trying to achieve?"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Mission *</Label>
            <Textarea
              id="mission"
              placeholder="Describe the mission in detail..."
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="example">Example of Desired Output Format</Label>
            <Textarea
              id="example"
              placeholder="Provide an example of what the output should look like..."
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Rules / Notes</Label>
            <Textarea
              id="rules"
              placeholder="Any specific rules or notes for the agents..."
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Triggering Workflow...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Experiment Workflow
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
