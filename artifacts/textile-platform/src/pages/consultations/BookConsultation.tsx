import { Shell } from "@/components/layout/Shell";
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  useListServices, 
  useListExperts,
  useCreateAppointment
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Microscope, Link, Star } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  serviceId: z.coerce.number().min(1, "Please select a service"),
  expertId: z.coerce.number().min(1, "Please select an expert"),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please select a time"),
  userName: z.string().min(2, "Name is required"),
  userEmail: z.string().email("Invalid email address"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BookConsultation() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialService = searchParams.get('service');
  const initialExpert = searchParams.get('expert');

  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: services } = useListServices();
  const { data: experts } = useListExperts();
  
  const createAppointment = useCreateAppointment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: initialService ? Number(initialService) : undefined,
      expertId: initialExpert ? Number(initialExpert) : undefined,
      userName: "",
      userEmail: "",
      notes: "",
      time: "",
    },
  });

  const selectedServiceId = form.watch("serviceId");
  const selectedExpertId = form.watch("expertId");
  
  const selectedService = services?.find(s => s.id === selectedServiceId);
  const selectedExpert = experts?.find(e => e.id === selectedExpertId);

  const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

  const onSubmit = (data: FormValues) => {
    // Combine date and time
    const [hours, minutes] = data.time.split(':');
    const scheduledAt = new Date(data.date);
    scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

    createAppointment.mutate({
      data: {
        serviceId: data.serviceId,
        expertId: data.expertId,
        scheduledAt: scheduledAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userEmail: data.userEmail,
        userName: data.userName,
        notes: data.notes
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        window.scrollTo(0, 0);
      },
      onError: () => {
        toast({
          title: "Booking Failed",
          description: "There was an error booking your consultation. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["serviceId"]);
    } else if (step === 2) {
      isValid = await form.trigger(["expertId"]);
    } else if (step === 3) {
      isValid = await form.trigger(["date", "time"]);
    }

    if (isValid) {
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo(0, 0);
  };

  if (isSuccess) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-32 max-w-3xl text-center">
          <div className="w-24 h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Booking Confirmed</h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Your consultation with {selectedExpert?.name} has been successfully scheduled. We've sent a confirmation email with calendar invites and the secure video link.
          </p>
          <div className="bg-muted/30 border border-border p-8 text-left mb-10 mx-auto max-w-xl">
            <h3 className="font-serif font-bold text-lg mb-4 text-primary">Session Details</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Service</span>
                <span className="font-bold text-primary">{selectedService?.name}</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Expert</span>
                <span className="font-bold text-primary">{selectedExpert?.name}</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-bold text-primary">
                  {form.getValues("date") && format(form.getValues("date"), "MMMM d, yyyy")} at {form.getValues("time")}
                </span>
              </li>
            </ul>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">Book Consultation</h1>
          
          {/* Progress Bar */}
          <div className="mt-10 flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/20 z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-accent z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2
                  ${step > i ? 'bg-accent border-accent text-primary' : 
                    step === i ? 'bg-primary border-accent text-accent' : 
                    'bg-primary border-white/20 text-white/50'}`}
              >
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs font-bold uppercase tracking-widest text-white/50">
            <span className={step >= 1 ? "text-accent" : ""}>Service</span>
            <span className={step >= 2 ? "text-accent" : ""}>Expert</span>
            <span className={step >= 3 ? "text-accent" : ""}>Schedule</span>
            <span className={step >= 4 ? "text-accent" : ""}>Details</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step 1: Service */}
            <div className={step === 1 ? "block" : "hidden"}>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Select a Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map(service => (
                  <div 
                    key={service.id}
                    onClick={() => form.setValue("serviceId", service.id)}
                    className={`cursor-pointer border p-6 transition-all ${
                      selectedServiceId === service.id 
                        ? 'border-secondary bg-secondary/5 shadow-sm' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-muted flex items-center justify-center text-primary">
                        <Microscope className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="font-serif font-bold text-lg text-primary">
                          {service.currency === 'USD' ? '$' : service.currency}{service.price}
                        </div>
                        <div className="text-xs text-muted-foreground">{service.duration} mins</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-primary mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Expert */}
            <div className={step === 2 ? "block" : "hidden"}>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Select an Expert</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experts?.map(expert => (
                  <div 
                    key={expert.id}
                    onClick={() => form.setValue("expertId", expert.id)}
                    className={`cursor-pointer border p-6 flex gap-4 transition-all ${
                      selectedExpertId === expert.id 
                        ? 'border-secondary bg-secondary/5 shadow-sm' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="w-16 h-16 bg-muted shrink-0 overflow-hidden">
                      {expert.avatar ? (
                        <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User /></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">{expert.name}</h3>
                      <p className="text-xs text-secondary font-bold mb-2">{expert.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" /> {expert.rating}</span>
                        <span>{expert.yearsExperience} yrs exp</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Date & Time */}
            <div className={step === 3 ? "block" : "hidden"}>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Select Date & Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base">Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal h-12 ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Time (Your Local Time)</FormLabel>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {timeSlots.map(time => (
                            <div 
                              key={time}
                              onClick={() => field.onChange(time)}
                              className={`cursor-pointer border py-3 text-center text-sm font-medium transition-colors ${
                                field.value === time 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-background hover:border-primary/50 text-primary'
                              }`}
                            >
                              {time}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Details */}
            <div className={step === 4 ? "block" : "hidden"}>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Your Details</h2>
              <div className="space-y-6 bg-muted/20 p-8 border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="h-12 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} className="h-12 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context / Questions for Expert (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Briefly describe the specific challenge or topic you'd like to discuss..." 
                          className="min-h-[120px] bg-white"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Summary Box */}
              <div className="mt-8 bg-primary text-white p-6 border-l-4 border-accent">
                <h3 className="font-serif font-bold text-lg mb-4">Session Summary</h3>
                <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-white/80">
                  <div><strong className="text-white">Service:</strong> {selectedService?.name}</div>
                  <div><strong className="text-white">Expert:</strong> {selectedExpert?.name}</div>
                  {form.getValues("date") && form.getValues("time") && (
                    <div><strong className="text-white">When:</strong> {format(form.getValues("date"), "MMM d, yyyy")} at {form.getValues("time")}</div>
                  )}
                  <div><strong className="text-white">Cost:</strong> ${selectedService?.price}</div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-border">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <div></div>
              )}
              
              {step < 4 ? (
                <Button type="button" onClick={nextStep} className="gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" className="gap-2 bg-secondary hover:bg-secondary/90 text-white" disabled={createAppointment.isPending}>
                  {createAppointment.isPending ? "Confirming..." : "Confirm Booking"} <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
          </form>
        </Form>
      </div>
    </Shell>
  );
}
