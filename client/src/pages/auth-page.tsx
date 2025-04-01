import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { z } from "zod";
import { useAuth, loginResolver, registerResolver } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DumbbellIcon, UserIcon, LockIcon, MailIcon, UserPlusIcon } from 'lucide-react';

type LoginFormValues = {
  username: string;
  password: string;
};

type RegisterFormValues = {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: loginResolver,
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: registerResolver,
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "member", // Default role
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    await loginMutation.mutateAsync(data);
  };

  // Handle register submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    await registerMutation.mutateAsync(data);
  };

  // Reset forms when switching tabs
  useEffect(() => {
    if (activeTab === "login") {
      loginForm.reset();
    } else {
      registerForm.reset();
    }
  }, [activeTab, loginForm, registerForm]);

  // If user is logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Auth forms */}
      <div className="flex items-center justify-center w-full md:w-1/2 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">RepWizard</CardTitle>
            <CardDescription className="text-center">
              Your personal workout tracking assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              <Input
                                {...field}
                                className="pl-10"
                                placeholder="Enter your username"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              <Input
                                {...field}
                                type="password"
                                className="pl-10"
                                placeholder="Enter your password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="First name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Last name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              <Input
                                {...field}
                                className="pl-10"
                                placeholder="Choose a username"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              <Input
                                {...field}
                                type="email"
                                className="pl-10"
                                placeholder="Enter your email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              <Input
                                {...field}
                                type="password"
                                className="pl-10"
                                placeholder="Create a password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                              <Input
                                {...field}
                                type="password"
                                className="pl-10"
                                placeholder="Confirm your password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <input type="hidden" {...registerForm.register("role")} value="member" />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" 
                ? "Don't have an account? " 
                : "Already have an account? "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" ? "Register" : "Login"}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-primary/10 flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <DumbbellIcon className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Track Your Fitness Journey</h1>
          <p className="text-lg mb-6">
            RepWizard helps you track workouts, monitor progress, and achieve your fitness goals with an intuitive mobile-first experience.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex items-start space-x-2">
              <UserPlusIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Create Programs</h3>
                <p className="text-sm text-muted-foreground">Design custom workout routines</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <UserPlusIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Record Workouts</h3>
                <p className="text-sm text-muted-foreground">Log sets, reps, and weights</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <UserPlusIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Track Progress</h3>
                <p className="text-sm text-muted-foreground">Visualize your improvements</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <UserPlusIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Schedule Sessions</h3>
                <p className="text-sm text-muted-foreground">Plan your workout calendar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Loader = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);