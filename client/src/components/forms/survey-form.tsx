import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { surveyRates } from "@shared/schema";
import { SurveyTypeCard } from "../ui/survey-type-card";

const surveyFormSchema = z.object({
  surveyType: z.enum(["yours", "yoursinternational", "ssi", "dynata"], {
    required_error: "Please select a survey type",
  }),
  completed: z.coerce.number()
    .int("Number of surveys must be a whole number")
    .min(1, "You must enter at least 1 survey")
    .max(100, "Maximum 100 surveys can be entered at once"),
});

type SurveyFormValues = z.infer<typeof surveyFormSchema>;

type SurveyFormProps = {
  onSuccess?: () => void;
};

export default function SurveyForm({ onSuccess }: SurveyFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's surveys to show which types have already been submitted
  const { data: todaySurveys } = useQuery({
    queryKey: ["/api/surveys/today"],
  });

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      completed: 1,
    },
  });

  // Watch the surveyType to update UI accordingly
  const selectedSurveyType = form.watch("surveyType");

  // Check which survey types are already submitted
  const isSubmitted = (type: string) => {
    if (!todaySurveys) return false;
    return !!todaySurveys[type];
  };

  // Disable already submitted survey types
  useEffect(() => {
    if (todaySurveys) {
      // If selected type is already submitted, reset selection
      if (selectedSurveyType && isSubmitted(selectedSurveyType)) {
        form.setValue("surveyType", undefined as any);
      }
    }
  }, [todaySurveys, selectedSurveyType, form]);

  async function onSubmit(values: SurveyFormValues) {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/surveys", values);
      
      // Invalidate queries to refresh survey data
      queryClient.invalidateQueries({ queryKey: ["/api/surveys/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      
      toast({
        title: "Survey work submitted",
        description: `${values.completed} surveys submitted for ${values.surveyType}.`,
      });
      
      // Reset form
      form.reset({
        surveyType: undefined as any,
        completed: 1,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Failed to submit survey work",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate earnings based on selected survey type and count
  const calculateEarnings = () => {
    const type = form.getValues("surveyType");
    const count = form.getValues("completed") || 0;
    
    if (!type) return 0;
    return surveyRates[type] * count;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="surveyType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Survey Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="yours"
                        id="yours"
                        className="sr-only"
                        disabled={isSubmitted("yours")}
                      />
                    </FormControl>
                    <label htmlFor="yours">
                      <SurveyTypeCard
                        type="yours"
                        name="Yours Surveys"
                        rate={surveyRates.yours}
                        isSelected={field.value === "yours"}
                        isDisabled={isSubmitted("yours")}
                      />
                    </label>
                  </FormItem>
                  
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="yoursinternational"
                        id="yoursinternational"
                        className="sr-only"
                        disabled={isSubmitted("yoursinternational")}
                      />
                    </FormControl>
                    <label htmlFor="yoursinternational">
                      <SurveyTypeCard
                        type="yoursinternational"
                        name="Yours Surveys International"
                        rate={surveyRates.yoursinternational}
                        isSelected={field.value === "yoursinternational"}
                        isDisabled={isSubmitted("yoursinternational")}
                      />
                    </label>
                  </FormItem>
                  
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="ssi"
                        id="ssi"
                        className="sr-only"
                        disabled={isSubmitted("ssi")}
                      />
                    </FormControl>
                    <label htmlFor="ssi">
                      <SurveyTypeCard
                        type="ssi"
                        name="SSI"
                        rate={surveyRates.ssi}
                        isSelected={field.value === "ssi"}
                        isDisabled={isSubmitted("ssi")}
                      />
                    </label>
                  </FormItem>
                  
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="dynata"
                        id="dynata"
                        className="sr-only"
                        disabled={isSubmitted("dynata")}
                      />
                    </FormControl>
                    <label htmlFor="dynata">
                      <SurveyTypeCard
                        type="dynata"
                        name="Dynata"
                        rate={surveyRates.dynata}
                        isSelected={field.value === "dynata"}
                        isDisabled={isSubmitted("dynata")}
                      />
                    </label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="completed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Completed Surveys</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedSurveyType && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              Estimated earnings: <span className="font-semibold">₹{calculateEarnings()}</span>
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedSurveyType}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Survey Work"
          )}
        </Button>
      </form>
    </Form>
  );
}
