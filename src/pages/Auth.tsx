import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, PatientSignupData, PhysicianSignupData } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { specializationsApi } from "@/lib/api";
import { Heart, User, Stethoscope, Mail, Lock, Phone, MapPin, Building } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, login, signupPatient, signupPhysician } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPhysician, setIsPhysician] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({ username: "", password: "", rememberMe: false });
  
  // Patient signup form
  const [patientData, setPatientData] = useState<PatientSignupData>({
    name: "", phone: "", gender: "Male", address: "", city: "",
    email: "", password: "", userName: "", subscriptionId: 0, image: null
  });
  
  // Physician signup form
  const [physicianData, setPhysicianData] = useState<PhysicianSignupData>({
    name: "", specializationId: 0, clinicalAddress: "",
    email: "", password: "", phone: "", userName: "", image: null
  });

  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations"],
    queryFn: specializationsApi.getAll,
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(loginData.username, loginData.password, loginData.rememberMe);
    
    if (result.success) {
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
      navigate("/");
    } else {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
    }
    
    setIsLoading(false);
  };

  const handlePatientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signupPatient(patientData);
    
    if (result.success) {
      toast({ title: "Account created!", description: "Please login with your credentials." });
    } else {
      toast({ title: "Signup failed", description: result.error, variant: "destructive" });
    }
    
    setIsLoading(false);
  };

  const handlePhysicianSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signupPhysician(physicianData);
    
    if (result.success) {
      toast({ title: "Account created!", description: "Please login with your credentials." });
    } else {
      toast({ title: "Signup failed", description: result.error, variant: "destructive" });
    }
    
    setIsLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'patient' | 'physician') => {
    const file = e.target.files?.[0] || null;
    if (type === 'patient') {
      setPatientData(prev => ({ ...prev, image: file }));
    } else {
      setPhysicianData(prev => ({ ...prev, image: file }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">HomeCare Services</CardTitle>
          <CardDescription>Your health, our priority</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      className="pl-10"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remember"
                      checked={loginData.rememberMe}
                      onCheckedChange={(checked) => setLoginData(prev => ({ ...prev, rememberMe: checked }))}
                    />
                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                  </div>
                  <Button type="button" variant="link" className="px-0 text-sm">
                    Forgot password?
                  </Button>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            {/* Signup Tab */}
            <TabsContent value="signup">
              <div className="flex items-center justify-center space-x-4 mb-6 p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className={`h-5 w-5 ${!isPhysician ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={!isPhysician ? 'font-medium' : 'text-muted-foreground'}>Patient</span>
                </div>
                <Switch
                  checked={isPhysician}
                  onCheckedChange={setIsPhysician}
                />
                <div className="flex items-center space-x-2">
                  <Stethoscope className={`h-5 w-5 ${isPhysician ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={isPhysician ? 'font-medium' : 'text-muted-foreground'}>Physician</span>
                </div>
              </div>
              
              {!isPhysician ? (
                // Patient Signup Form
                <form onSubmit={handlePatientSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={patientData.name}
                        onChange={(e) => setPatientData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        placeholder="johndoe"
                        value={patientData.userName}
                        onChange={(e) => setPatientData(prev => ({ ...prev, userName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10"
                          value={patientData.email}
                          onChange={(e) => setPatientData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={patientData.password}
                          onChange={(e) => setPatientData(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          className="pl-10"
                          value={patientData.phone}
                          onChange={(e) => setPatientData(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={patientData.gender}
                        onValueChange={(value) => setPatientData(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cairo"
                          className="pl-10"
                          value={patientData.city}
                          onChange={(e) => setPatientData(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subscription</Label>
                      <Select
                        value={patientData.subscriptionId.toString()}
                        onValueChange={(value) => setPatientData(prev => ({ ...prev, subscriptionId: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Free Plan</SelectItem>
                          <SelectItem value="1">Premium</SelectItem>
                          <SelectItem value="2">24/7 Care</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="123 Main Street"
                        className="pl-10"
                        value={patientData.address}
                        onChange={(e) => setPatientData(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'patient')}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Patient Account"}
                  </Button>
                </form>
              ) : (
                // Physician Signup Form
                <form onSubmit={handlePhysicianSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Dr. John Doe"
                        value={physicianData.name}
                        onChange={(e) => setPhysicianData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        placeholder="drjohndoe"
                        value={physicianData.userName}
                        onChange={(e) => setPhysicianData(prev => ({ ...prev, userName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="doctor@hospital.com"
                          className="pl-10"
                          value={physicianData.email}
                          onChange={(e) => setPhysicianData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={physicianData.password}
                          onChange={(e) => setPhysicianData(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          className="pl-10"
                          value={physicianData.phone}
                          onChange={(e) => setPhysicianData(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Specialization</Label>
                      <Select
                        value={physicianData.specializationId.toString()}
                        onValueChange={(value) => setPhysicianData(prev => ({ ...prev, specializationId: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec.id} value={spec.id.toString()}>
                              {spec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Clinical Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="123 Medical Center"
                        className="pl-10"
                        value={physicianData.clinicalAddress}
                        onChange={(e) => setPhysicianData(prev => ({ ...prev, clinicalAddress: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'physician')}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Physician Account"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
