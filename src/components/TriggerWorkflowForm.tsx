import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Loader2, Plus, Globe, Save, FileText, Trash2 } from "lucide-react";
import { useExperimentTemplates, ExperimentTemplate } from "@/hooks/useExperimentTemplates";
import { SaveTemplateDialog } from "@/components/SaveTemplateDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const N8N_WEBHOOK_URL = "https://boardsai.app.n8n.cloud/webhook/575b5dc9-dbd9-4113-81fd-8fea8342f97d";

interface WorkflowFormData {
  goal: string;
  mission: string;
  example: string;
  rules: string;
  useWebsearch: boolean;
}

interface TriggerWorkflowFormProps {
  collapsed?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TriggerWorkflowForm({ collapsed = false, open, onOpenChange }: TriggerWorkflowFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [formData, setFormData] = useState<WorkflowFormData>({
    goal: "",
    mission: "",
    example: "",
    rules: "",
    useWebsearch: false,
  });

  const { user } = useAuth();
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useExperimentTemplates();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId === "new") {
      // Clear form for new template
      setFormData({
        goal: "",
        mission: "",
        example: "",
        rules: "",
        useWebsearch: false,
      });
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        goal: template.goal,
        mission: template.mission,
        example: template.example,
        rules: template.rules,
        useWebsearch: template.use_websearch,
      });
    }
  };

  const handleSaveTemplate = async (name: string) => {
    const templateData = {
      name,
      goal: formData.goal,
      mission: formData.mission,
      example: formData.example,
      rules: formData.rules,
      use_websearch: formData.useWebsearch,
    };

    const result = await addTemplate(templateData);
    if (result) {
      setSelectedTemplateId(result.id);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    await updateTemplate(selectedTemplate.id, {
      goal: formData.goal,
      mission: formData.mission,
      example: formData.example,
      rules: formData.rules,
      use_websearch: formData.useWebsearch,
    });
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    const confirmed = window.confirm(`Delete template "${selectedTemplate.name}"?`);
    if (confirmed) {
      await deleteTemplate(selectedTemplate.id);
      setSelectedTemplateId("");
      setFormData({
        goal: "",
        mission: "",
        example: "",
        rules: "",
        useWebsearch: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.goal.trim() || !formData.mission.trim()) {
      toast.error("Goal and Mission are required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a tracking UUID for this request
      const requestId = crypto.randomUUID();
      
      const parameters = {
        goal: formData.goal,
        mission: formData.mission,
        example: formData.example,
        rules: formData.rules,
        use_websearch: formData.useWebsearch,
      };

      // Insert tracking record into experiment_requests table
      if (user) {
        const { error: trackingError } = await supabase
          .from('experiment_requests')
          .insert({
            id: requestId,
            user_id: user.id,
            status: 'pending',
            parameters,
          });

        if (trackingError) {
          console.error("Error creating tracking record:", trackingError);
          // Continue anyway - tracking is optional
        }
      }

      // Send request to n8n with request_id
      const params = new URLSearchParams({
        request_id: requestId,
        goal: formData.goal,
        mission: formData.mission,
        example: formData.example,
        rules: formData.rules,
        use_websearch: formData.useWebsearch.toString(),
      });

      const response = await fetch(`${N8N_WEBHOOK_URL}?${params.toString()}`, {
        method: "GET",
      });

      if (response.ok) {
        toast.success(`Workflow triggered! Tracking ID: ${requestId.slice(0, 8)}...`);
        setFormData({ goal: "", mission: "", example: "", rules: "", useWebsearch: false });
        setSelectedTemplateId("");
        setIsOpen(false);
      } else {
        // Update tracking record to failed if we have a user
        if (user) {
          await supabase
            .from('experiment_requests')
            .update({ status: 'failed', error_message: 'Failed to trigger workflow' })
            .eq('id', requestId);
        }
        toast.error("Failed to trigger workflow");
      }
    } catch (error) {
      console.error("Error triggering workflow:", error);
      toast.error("Failed to connect to n8n workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId("");
      setFormData({
        goal: "",
        mission: "",
        example: "",
        rules: "",
        useWebsearch: false,
      });
    }
  }, [isOpen]);

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

  const hasChanges = selectedTemplate && (
    formData.goal !== selectedTemplate.goal ||
    formData.mission !== selectedTemplate.mission ||
    formData.example !== selectedTemplate.example ||
    formData.rules !== selectedTemplate.rules ||
    formData.useWebsearch !== selectedTemplate.use_websearch
  );

  return (
    <>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Trigger Experiment Workflow
            </DialogTitle>
            <DialogDescription>
              Start an n8n workflow to run agents. Results will be added as new experiments when complete.
            </DialogDescription>
          </DialogHeader>

          {/* Template Selector */}
          {user && (
            <div className="space-y-2 pb-2 border-b">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Template
              </Label>
              <div className="flex gap-2">
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a template or start fresh..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Start Fresh
                      </span>
                    </SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteTemplate}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Template</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="use-websearch" className="text-sm font-medium">
                    Enable Web Search
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow agents to search the web for additional context
                  </p>
                </div>
              </div>
              <Switch
                id="use-websearch"
                checked={formData.useWebsearch}
                onCheckedChange={(checked) => setFormData({ ...formData, useWebsearch: checked })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              {user && (
                <>
                  {selectedTemplate && hasChanges ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUpdateTemplate}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Update
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                    className="gap-2"
                    disabled={!formData.goal.trim() && !formData.mission.trim()}
                  >
                    <Save className="h-4 w-4" />
                    Save New
                  </Button>
                </>
              )}
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Workflow
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveTemplate}
      />
    </>
  );
}
